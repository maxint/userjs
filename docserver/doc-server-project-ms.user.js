// ==UserScript==
// @name        ArcSoft Project Management
// @version     0.0.2
// @author      maxint <NOT_SPAM_lnychina@gmail.com>
// @namespace   http://maxint.github.io
// @description An enhancement for Arcsoft project management system in http://doc-server
// @include     http://doc-server/*
// @updateURL   https://github.com/maxint/userjs/docserver/doc-server-project-ms.user.js
// @downloadURL https://github.com/maxint/userjs/docserver/doc-server-project-ms.user.js
// @Note
// v0.0.2
//  - "Add Rlease" 窗口自动保存表单
//
// v0.0.1
//  - 首页 | “项目” 导航到 “项目跟踪”
//  - “项目跟踪”页面添加 "Release"
//  - "Add Release Package" 窗口：
//      * 自动填写日期
//      * 根据Release Package填写Version
//      * 自动查询Related Project名称
//
// ==/UserScript==

// a function that loads jQuery and calls a callback function when jQuery has finished loading
function withjQuery(callback, safe) {
    if (typeof(jQuery) == "undefined") {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js";
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
        console.log('Using jquery ' + jQuery().jquery);
        setTimeout(function() {
            //Firefox supports
            console.log('Runing custom script');
            callback(jQuery, typeof(unsafeWindow) == "undefined" ? window : unsafeWindow);
        }, 30);
    }
}

// the guts of this userscript
withjQuery(function($, window) {
    // helper functions
    function deserialize(name, def) {
        return localStorage.getItem(name) || def;
    }
    function serialize(name, val) {
        localStorage.setItem(name, val);
    }

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
        // date
        var d = new Date();
        $('input#txtDate').val(d.getFullYear() + '/' + d.getMonth() + '/' + d.getDay());
        // release package
        $('input#txtDeliveryPackage').change(function(){
            var val = $(this).val();
            var vers = /(\d+)\.(\d+)\.\d+\.(\d+)/g.exec(val);
            if (vers == null) {
                vers = /(\d+)\.(\d+)\.(\d+)/g.exec(val);
            }
            if (vers) {
                $("input[name='txtVersion']").val('v' + [vers[1], vers[2], vers[3]].join('.'));
            }
        }).val(deserialize('release.package', '')).css({
            'width': '100%',
        });
        $('input#txtReleasePath').val(deserialize('release.releasepath')).css({
            'width': '100%',
        });
        $("input[name='txtVersion']").val(deserialize('release.version'));
        // related project
        function updateProjectName(id) {
            var msgdiv = $('#btnCheckReleatedProject').next();
            if (/^[0-9]{4}$/.test(id)) {
                var url = '../ProjectDelivery/delivery_releated_project_list.asp?projid=' + id;
                msgdiv.load(url + ' td:nth-child(2)');
            } else {
                msgdiv.html('<font color="#FF0000">No project found</font>');
            }
        }
        var prevID = deserialize('release.relatedProjectID');
        $("input[name='txtReleaseReleatedProject']").keyup(function(){
            var val = $(this).val();
            updateProjectName(val);
        }).val(prevID);
        if (prevID)
            updateProjectName(prevID);
        // notes
        $('textarea#txtNotes').val(deserialize('release.note'))
        // debug
        console.log(localStorage);
        // save result when submit
        $('#form1').change(function() {
            serialize('release.relatedProjectID', $("input[name='txtReleaseReleatedProject']").val());
            serialize('release.note', $('textarea#txtNotes').val());
            serialize('release.package', $('input#txtDeliveryPackage').val());
            serialize('release.releasepath', $('input#txtReleasePath').val());
            serialize('release.version', $("input[name='txtVersion']").val());
        });
    }
}, true);
