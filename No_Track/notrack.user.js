// ==UserScript==
// @name        No Track
// @version     1
// @author      maxint <NOT_SPAM_lnychina@gmail.com>
// @namespace   http://maxint.github.io
// @description Disable track of search engine
// @include     https://search.yahoo.com/yhs/search*
// @updateURL   https://raw.githubusercontent.com/maxint/userjs/master/No_Track/notrack.user.js
// @downloadURL https://raw.githubusercontent.com/maxint/userjs/master/No_Track/notrack.user.js
// @grant       none
// ==/UserScript==

// a function that loads jQuery and calls a callback function when jQuery has finished loading
; (function (callback, safe) {
    "use strict";
    if (jQuery === undefined) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.11.1.min.js";
        if (safe) {
            var cb = document.createElement("script");
            cb.type = "text/javascript";
            cb.textContent = "jQuery.noConflict();(" + callback.toString() + ")(jQuery, window);";
            script.addEventListener('load', function() {
                document.head.appendChild(cb);
            });
        } else {
            var dollar = ($ !== undefined) ? $ : undefined;
            script.addEventListener('load', function () {
                jQuery.noConflict();
                $ = dollar;
                callback(jQuery, window);
            });
        }
        document.head.appendChild(script);
    } else {
        setTimeout(function(){
            //Firefox supports
            console.log('Runing custom script');
            callback(jQuery, unsafeWindow == undefined ? window : unsafeWindow);
        }, 30);
    }
})(function ($) {
    console.log('Using jquery ' + $().jquery);
    $("a[id^='link']").each(function () {
        $(this).attr('dirtyhref', $(this).attr('href')).attr('target', '_blank');
    });
}, true);
