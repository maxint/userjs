// ==UserScript==
// @name        ArcSoft Project Management
// @version     0.0.1
// @author      maxint <NOT_SPAM_lnychina@gmail.com>
// @namespace   http://maxint.github.io
// @description An enhancement for Arcsoft project management system in http://doc-server
// @include     http://doc-server/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @updateURL   https://github.com/maxint/userjs/docserver/doc-server-project-ms.user.js
// @downloadURL https://github.com/maxint/userjs/docserver/doc-server-project-ms.user.js
// @Note        
// ==/UserScript==

// a function that loads jQuery and calls a callback function when jQuery has finished loading
function withjQuery(callback, safe){
    if (typeof(jQuery) == "undefined") {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js";
        if (safe) {
            var cb = document.createElement("script");
            cb.type = "text/javascript";
            cb.textContent = "jQuery.noConflict();(" + callback.toString() + ")(jQuery, window);";
            script.addEventListener('load', function() {
                document.head.appendChild(cb);
            });
        } else {
            var dollar = undefined;
            if (typeof($) != "undefined") dollar = $;
            script.addEventListener('load', function() {
                jQuery.noConflict();
                $ = dollar;
                callback(jQuery, window);
            });
        }
        document.head.appendChild(script);
    } else {
        setTimeout(function() {
            //Firefox supports
            callback(jQuery, typeof unsafeWindow === "undefined" ? window : unsafeWindow);
        }, 30);
    }
}

// the guts of this userscript
withjQuery(function($, window) {
    // replace main menu [Project]
    $('li#mainMenuItem_150000 a').attr('href', '/projectManage/ProjectList.asp');

    // operate w.r.t. sub path
    var subpath = window.location.pathname
    if (subpath == '/projectManage/ProjectList.asp') {
        console.log('ProjectList');
        var trs = $('table.ListTable tbody tr');
        trs.first().find('th:nth-child(2)').after('<th>Operations</th>');
        trs.nextAll().each(function() {
            var id = $(this).find('td:first a:first').text();
            var rlsUrl = 'ProjectOther/ReleaseList.asp?proj_id=' + id
            var link = '<a href="' + rlsUrl + '">Release</a>'
            $(this).find('td:nth-child(2)').after('<td>' + link + '</td>');
        });
    } else if (subpath == '/projectManage/ProjectOther/addRelease.asp') {
        console.log('addRelease');
        var tds = $('table.EditTable tbody tr td');
        // date
        var d = new Date();
        var dstr = d.getFullYear() + '/' + d.getMonth() + '/' + d.getDay()
        tds.eq(1).find('input:first').val(dstr);
        // pkg input
        $('input#txtDeliveryPackage').change(function(){
            var val = $(this).val();
            var vers = /(\d+)\.(\d+)\.\d+\.(\d+)/g.exec(val);
            if (vers == null) {
                vers = /(\d+)\.(\d+)\.(\d+)/g.exec(val);
            }
            if (vers) {
                tds.eq(2).find('input:first').val('v' + [vers[1], vers[2], vers[3]].join('.'))
                //console.log(vers);
            }
        });
        tds.eq(5).find('input:first').change(function(){
            var val = $(this).val();
            var url = '../ProjectDelivery/delivery_releated_project_list.asp?projid=' + val
            tds.eq(5).find('div.info').load(url + ' td:nth-child(2)')
        });
        // get release packages
        //tds.css('background-color', 'red');
        //console.log('hi');
    }
}, true);
