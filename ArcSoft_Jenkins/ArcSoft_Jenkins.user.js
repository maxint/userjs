// ==UserScript==
// @name        ArcSoft Jenkins
// @version     4
// @author      maxint <NOT_SPAM_lnychina@gmail.com>
// @namespace   http://maxint.github.io
// @description Save forms etc.
// @include     http://abs02/jenkins/job/*/build*
// @updateURL   https://raw.githubusercontent.com/maxint/userjs/master/ArcSoft_Jenkins/ArcSoft_Jenkins.user.js
// @downloadURL https://raw.githubusercontent.com/maxint/userjs/master/ArcSoft_Jenkins/ArcSoft_Jenkins.user.js
// @grant       none
// @Note
// ==/UserScript==
//

// a function that loads jQuery and calls a callback function when jQuery has finished loading
; (function (callback, safe) {
	"use strict";
	var callback2 = function (jQuery_old, jQuery) {
		//Firefox supports
		console.log('Using jquery ' + jQuery().jquery);
		console.log('Runing custom script');
		callback(jQuery_old, jQuery, typeof(unsafeWindow) === "undefined" ? window : unsafeWindow);
	};
	if (typeof(jQuery) === "undefined" || jQuery.jquery !== '2.1.4') {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "//apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js";
		if (safe) {
			var cb = document.createElement("script");
			cb.type = "text/javascript";
			cb.textContent = "var jq = jQuery.noConflict();(" + callback.toString() + ")($, jq, window);";
			script.addEventListener('load', function() {
				document.head.appendChild(cb);
			});
		} else {
			script.addEventListener('load', function () {
				var jq = jQuery.noConflict();
				callback2($, jq);
			});
		}
		document.head.appendChild(script);
	} else {
		setTimeout(function () {
			callback2(jQuery, jQuery);
		}, 30);
	}
})(function (jq, $, window) {
	"use strict";
	// helper functions
	// local storage
	var IStorage = function (prefix) {
		var db = window.localStorage;
		var pref = prefix + '.';
		var addpref = function (key) { return pref + key; };
		var nameRegExp = new RegExp('^' + prefix + '\\.' + '(.+)$');
		this.prefix = prefix;
		this.get = function (key, def) {
			var val = db.getItem(addpref(key));
			if (val !== null) {
				return val;
			} else {
				return def || null;
			}
		};
		this.set = function (key, val) {
			db.setItem(addpref(key), val);
		};
		this.remove = function (key) {
			db.removeItem(addpref(key));
		};
		this.clear = function () {
			var names = this.getNames();
			console.log('[W] Remove all objects in "' + this.prefix + '" storage: ' + names);
			for (var i = 0; i < names.length; ++i) {
				this.remove(names[i]);
			}
		};
		this.flush = function () {
			db.clear();
		};
		this.getObject = function (key, def) {
			var val = this.get(key);
			return val ? JSON.parse(val) : (def || null);
		};
		this.setObject = function (key, val) {
			this.set(key, JSON.stringify(val));
		};
		this.getNames = function () {
			var names = [];
			var n = db.length;
			//console.log(nameRegExp);
			for (var i = 0; i < n; ++i) {
				var m = nameRegExp.exec(db.key(i));
				if (m === null || m.length === 1) {
					//console.log(' ~ ' + db.key(i) + '|');
					continue;
				}
				names.push(m[1]);
			}
			return names;
		};
		this.copyFrom = function (istore) {
			var names = this.getNames();
			console.log('[I] Object names in "' + this.prefix + '" storage: ' + names);
			if (names.length > 0) return;
			names = istore.getNames();
			console.log('[W] Copy data from "' + istore.prefix + '" storage: ' + names);
			for (var i=0; i < names.length; ++i) {
				var n = names[i];
				var v = istore.get(n);
				console.log('[W] - ' + n + ': ' + v);
				this.set(n, v);
			}
			return true;
		};
	};

	// assert function
	function assert(condition, message) {
		if (!condition) {
			throw message || "Assertion failed";
		}
	}
	// fill input values
	function fillValues(key_id_pairs, istore) {
		console.log('[I] Fill field values');
		for (var key in key_id_pairs) {
			if (key_id_pairs.hasOwnProperty(key)) {
				var elem = key_id_pairs[key];
				var elemType = elem.type;
				if (elemType == undefined)
					console.log('[W] Undefined element type of field:' + elem);
				// debug
				console.log('[D] - ' + key + ' [' + elemType + ']: ' + istore.get(key, ''));
				var newValue = istore.get(key);
				if (newValue == null)
					continue
				if (elemType === 'checkbox' || elemType === 'radio') {
					elem.checked = newValue == 'true';
				} else if (elemType === 'select-one' || elemType === 'select-multiple') {
					$(elem).val(newValue);
				} else {
					$(elem).val(newValue);
				}
			}
		}
	}
	// save input values
	function storeValues(key_id_pairs, istore) {
		console.log('[I] Save field values');
		for (var key in key_id_pairs) {
			if (key_id_pairs.hasOwnProperty(key)) {
				var elem = key_id_pairs[key];
				if (elem.type === 'checkbox' || elem.type === 'radio') {
					istore.set(key, elem.checked);
				} else {
					istore.set(key, elem.value);
				}
			}
		}
	}
	// operate w.r.t. sub path
	var subpath = window.location.pathname;
	console.log('Subpath: ' + subpath);
	if (/jenkins\/job\/[\w_]*\/build\b/.test(subpath)) {
		var projName = $('h1').get(0).innerHTML;
		projName = projName.substr(8, projName.length-8);
		var istore = new IStorage('project/build/' + projName);
		var pairs = {};
		$("table.parameters :input[name$='value']").each(function() {
			var name = this.name;
			if (name.endsWith('.value')) {
				name = name.substr(0, name.length-6) + '.' + this.value;
			} else {
				name = $(this).prev().val();
			}
			//console.log(this); console.log(name);
			pairs[name] = this;
		});
		fillValues(pairs, istore);
		var saveWhenUnload = true;
		$(window).unload(function () {
			console.log('[I] window unload');
			if (saveWhenUnload) {
				storeValues(pairs, istore);
			}
		});
		// add reset button
		$("table.parameters tbody:last input:last-child").after(
				'<span name="Submit" class="yui-button yui-submit-button submit-button primary">' +
				'<span class="first-child">' +
				'<button title="Reset all saved data!" type="button">Reset</button>' +
				'</span></span>');
		$('button:last-child').click(function() {
			saveWhenUnload = false;
			istore.clear();
			window.location.reload();
		});
	}
}, true);

// vim: et ts=2 sts=2 sw=2
