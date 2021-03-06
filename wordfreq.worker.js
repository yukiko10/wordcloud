
"use strict";

// For simulated worker in IE
var send = (typeof workerPostMessage !== 'undefined')?workerPostMessage:postMessage;

// http://tartarus.org/~martin/PorterStemmer/js.txt
// Porter stemmer in Javascript
// Release 1 be 'andargor', Jul 2004
// Release 2 (substantially revised) by Christopher McKenzie, Aug 2009
var stemmer=function(){var g={ational:"ate",tional:"tion",enci:"ence",anci:"ance",izer:"ize",bli:"ble",alli:"al",entli:"ent",eli:"e",ousli:"ous",ization:"ize",ation:"ate",ator:"ate",alism:"al",iveness:"ive",fulness:"ful",ousness:"ous",aliti:"al",iviti:"ive",biliti:"ble",logi:"log"},h={icate:"ic",ative:"",alize:"al",iciti:"ic",ical:"ic",ful:"",ness:""};return function(a){var d,b,e,c,f;if(a.length<3)return a;e=a.substr(0,1);if(e=="y")a=e.toUpperCase()+a.substr(1);c=/^(.+?)(ss|i)es$/;b=/^(.+?)([^s])s$/; if(c.test(a))a=a.replace(c,"$1$2");else if(b.test(a))a=a.replace(b,"$1$2");c=/^(.+?)eed$/;b=/^(.+?)(ed|ing)$/;if(c.test(a)){b=c.exec(a);c=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*/;if(c.test(b[1])){c=/.$/;a=a.replace(c,"")}}else if(b.test(a)){b=b.exec(a);d=b[1];b=/^([^aeiou][^aeiouy]*)?[aeiouy]/;if(b.test(d)){a=d;b=/(at|bl|iz)$/;f=/([^aeiouylsz])\1$/;d=/^[^aeiou][^aeiouy]*[aeiouy][^aeiouwxy]$/;if(b.test(a))a+="e";else if(f.test(a)){c=/.$/;a=a.replace(c,"")}else if(d.test(a))a+="e"}}c= /^(.+?)y$/;if(c.test(a)){b=c.exec(a);d=b[1];c=/^([^aeiou][^aeiouy]*)?[aeiouy]/;if(c.test(d))a=d+"i"}c=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;if(c.test(a)){b=c.exec(a);d=b[1];b=b[2];c=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*/;if(c.test(d))a=d+g[b]}c=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;if(c.test(a)){b=c.exec(a);d=b[1];b=b[2];c=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*/; if(c.test(d))a=d+h[b]}c=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;b=/^(.+?)(s|t)(ion)$/;if(c.test(a)){b=c.exec(a);d=b[1];c=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*[aeiouy][aeiou]*[^aeiou][^aeiouy]*/;if(c.test(d))a=d}else if(b.test(a)){b=b.exec(a);d=b[1]+b[2];b=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*[aeiouy][aeiou]*[^aeiou][^aeiouy]*/;if(b.test(d))a=d}c=/^(.+?)e$/;if(c.test(a)){b=c.exec(a);d=b[1];c=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*[aeiouy][aeiou]*[^aeiou][^aeiouy]*/; b=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*([aeiouy][aeiou]*)?$/;f=/^[^aeiou][^aeiouy]*[aeiouy][^aeiouwxy]$/;if(c.test(d)||b.test(d)&&!f.test(d))a=d}c=/ll$/;b=/^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*[aeiouy][aeiou]*[^aeiou][^aeiouy]*/;if(c.test(a)&&b.test(a)){c=/.$/;a=a.replace(c,"")}if(e=="y")a=e.toLowerCase()+a.substr(1);return a}}();

// English stopwords that is being filtered out by Google
// http://www.ranks.nl/resources/stopwords.html (the shortest list)
var englishStopWords = [
	'i','a','about',
	'an','and','are','as','at',
	'be','by','com','for',
	'from','how','in',
	'is','it','not',
	'of','on','or','that',
	'the','this','to','was',
	'what','when','where',
	'who','will','with',
	'www','the'
];
var cjkStopWords = [
	'([^\u76ee])\u7684', // chinese 'de'
	'\u3092', // wo
	'\u3067\u3059', // desu
	'\u3059\u308b', //suru
	'\u306e', //no
	'\u308c\u3089' //rera
];


var pool = {
	words: {},
	reps: {}
},
settings = {},
getList = function () {
	var list = [];
	for (var word in pool.words) {
		if (pool.words[word] < settings.mincount) continue;
		var maxRep;
		if (typeof pool.reps[word] === 'object') {
			var c = 0;
			for (var rep in pool.reps[word]) {
				if (typeof pool.reps[word][rep] === 'number' && pool.reps[word][rep] > c) {
					maxRep = rep;
					c = pool.reps[word][rep];
				}
			}
		}
		list.push([maxRep || word, pool.words[word]]);
		maxRep = false;
	}
	return list;
},
tasks = {
	init: function (ev) {
		settings = ev.data.settings;
	},
	processText : function (ev) {
		var words = {},
		reps = {},
		text = ev.data.text;
	
		function handleWord (word, rep) {
			if (typeof words[word] !== 'number') words[word] = 1;
			else words[word]++;
			if (rep) {
				if (typeof reps[word] !== 'object') reps[word] = {};
				if (typeof reps[word][rep] !== 'number') reps[word][rep] = 1;
				else reps[word][rep]++;
			}
		}
	
		function processCJK (text) {
			if (settings.de_commword) {
				cjkStopWords.forEach(
					function (w) {
						text = text.replace(new RegExp(w, 'g'), '$1\n');
					}
				);
			}
		
			// TBD: Cannot match CJK characters beyond BMP, e.g. \u20000-\u2A6DF at plane B.
			// Han: \u4E00-\u9FFF\u3400-\u4DBF
			// Kana: \u3041-\u309f\u30a0-\u30ff
			text = text.replace(/[^\u4E00-\u9FFF\u3400-\u4DBF\u3041-\u309f\u30a0-\u30ff]+/gm, '\n');
		
			var reg = /./g,
			reuni = /^.$/,
			rebi = /^.{2}$/,
			re3 = /^.{3}$/,
			re4 = /^.{4}$/,
			re5 = /^.{5}$/;
		
			text.replace(
				reg,
				function (str, offset, text) {
					if (settings.unigram) handleWord(str);
					if (settings.bigram && reuni.test(text[offset+1])) handleWord(str + text[offset+1]);
					if (settings.trigram && rebi.test(text.substr(offset+1, 2))) handleWord(str + text.substr(offset+1, 2));
					if (settings.four_gram && re3.test(text.substr(offset+1, 3))) handleWord(str + text.substr(offset+1, 3));
					if (settings.five_gram && re4.test(text.substr(offset+1, 4))) handleWord(str + text.substr(offset+1, 4));
					if (settings.six_gram && re5.test(text.substr(offset+1, 5))) handleWord(str + text.substr(offset+1, 5));
				}
			);
		
			if (settings.de_repetition) {
				// Not doing hasOwnProperty() coz this is a standalone worker js
				for (var word in words) /* if (words.hasOwnProperty(word)) */ {
					if (word.length === 1) return;
					var l = word.length-1;
					while (l) {
						var i = word.length-l;
						while (i >= 0) {
							var substr = word.substr(i, l);
							if (words[substr] && words[substr] === words[word]) words[substr] = -1; 
							i--;
						}
						l--;
					}
				}
			}
		}
		
		function processEnglish(text) {
			text
			.replace(/[^A-Za-zéÉ'’_\-0-9@\.]+/gm, '\n')
			.replace(/^([^\.]+)\.$/gm, '$1')
			.replace(/[\'\u2019](s|ll|d)?$/gm, '')
			.split('\n').forEach(
				function (word) {
					if (!word) return;
					if (/^[0-9\.@\-]+$/.test(word)) return;
					if (word.length < 2) return;
					if (settings.de_commword && englishStopWords.indexOf(word.toLowerCase()) !== -1) return;
					handleWord(stemmer(word).toLowerCase(), word);
				}
			);
		}
		
		if (settings.processCJK) processCJK(text);
		if (settings.processEnglish) processEnglish(text);

		for (var word in words)  {
			if (typeof pool.words[word] !== 'number') pool.words[word] = words[word];
			else pool.words[word] += words[word];
			if (reps[word]) {
				if (!pool.reps[word]) pool.reps[word] = reps[word];
				// else TBD
			}
		};
		send({returnData: pool.words, callbackId: ev.data.callbackId});
	},
	empty: function (ev) {
		pool.words = {};
		pool.reps = {};
		send({returnData: pool.words, callbackId: ev.data.callbackId});
	},
	getList: function (ev) {
		send({returnData: getList(), callbackId: ev.data.callbackId});
	},
	getSortedList: function (ev) {
		send(
			{
				returnData: getList().sort(
					function (a, b) {
						if (a[1] > b[1]) return -1;
						if (a[1] < b[1]) return 1;
						var t = [a[0], b[0]];
						t = t.sort();
						if (t[0] !== a[0]) return 1;
						return 0;
					}
				),
				callbackId: ev.data.callbackId
			}
		);
	},
	analyizeVolume: function (ev) {
		var v = 0;

		for (var word in pool.words) {
			if (pool.words[word] < settings.mincount) continue;
			v += word.length*pool.words[word]*pool.words[word];
		}
		send({returnData: v, callbackId: ev.data.callbackId});
	}
};

// Use keyword self to explicitly reference to the global object, as a workaround to Chrome 11
// See https://code.google.com/p/chromium/issues/detail?id=81371
self.onmessage = function (ev) {
	tasks[ev.data.task].call(this, ev);
};
