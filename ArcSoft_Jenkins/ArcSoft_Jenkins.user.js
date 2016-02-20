// ==UserScript==
// @name        ArcSoft Jenkins
// @namespace   http://maxint.github.io
// @description Save forms etc.
// @include     http://abs02/jenkins/job/*/build*
// @version     1
// @grant       none
// ==/UserScript==
//

// a function that loads jQuery and calls a callback function when jQuery has finished loading
; (function (callback, safe) {
    var callback2 = function (jQuery_old, jQuery) {
        //Firefox supports
        console.log('Using jquery ' + jQuery().jquery);
        console.log('Runing custom script');
        callback(jQuery_old, jQuery, typeof(unsafeWindow) == "undefined" ? window : unsafeWindow);
    };
    if (typeof(jQuery) == "undefined" || jQuery.jquery != '2.1.1') {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "//apps.bdimg.com/libs/jquery/2.1.1/jquery.min.js";
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
    // helper functions
    // local storage
    var IStorage = function (prefix) {
        var pref = prefix + '.';
        var addpref = function (key) { return pref + key; };
        this.get = function (key, def) {
            var val = window.localStorage.getItem(addpref(key));
            if (val !== null)
                return val;
            else
                return def !== undefined ? def : null;
        };
        this.set = function (key, val) {
            window.localStorage.setItem(addpref(key), val);
        };
        this.flush = function () {
            window.localStorage.clear();
        };
        this.getObject = function (key, def) {
            var val = this.get(key);
            return val ? JSON.parse(val) : (def || null);
        };
        this.setObject = function (key, val) {
            this.set(key, JSON.stringify(val));
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
        for (var key in key_id_pairs) {
            if (key_id_pairs.hasOwnProperty(key)) {
                var elem = key_id_pairs[key];
                var tagName = elem.type;
                if (tagName === 'checkbox') {
                    elem.checked = istore.get(key, 'false') == 'true';
                } else if (tagName === 'select-one') {
                    elem.value = istore.get(key, '');
                } else if (!elem.value) {
                    elem.value = istore.get(key, '');
                }
            }
        }
    }
    // save input values
    function storeValues(key_id_pairs, istore) {
        for (var key in key_id_pairs) {
            if (key_id_pairs.hasOwnProperty(key)) {
                var elem = key_id_pairs[key];
                if (elem.type == 'checkbox') {
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
        console.log('Auto save all fields in this page');
        var istore = new IStorage('project/build');
        var inputNames = $('input[type="hidden"][name="name"]');
        var inputValues = inputNames.next();
        var pairs = {};
        for (var i = 0; i < inputNames.length; ++i) {
            pairs[inputNames[i].value] = inputValues[i];
        }
        fillValues(pairs, istore);
        $(window).unload(function () {
            console.log('window unload');
            storeValues(pairs, istore);
        });
    }
}, true);
