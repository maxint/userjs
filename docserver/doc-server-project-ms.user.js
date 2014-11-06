// ==UserScript==
// @name        ArcSoft Project Management
// @version     0.0.3
// @author      maxint <NOT_SPAM_lnychina@gmail.com>
// @namespace   http://maxint.github.io
// @description An enhancement for Arcsoft project management system in http://doc-server
// @include     http://doc-server/*
// @updateURL   https://github.com/maxint/userjs/docserver/doc-server-project-ms.user.js
// @downloadURL https://github.com/maxint/userjs/docserver/doc-server-project-ms.user.js
// @Note
// v0.0.4
//  - Add management of "Related Projects".
//
// v0.0.3
//  - Add "Invert Rows" button to "Release List" page.
//
// v0.0.2
//  - Auto save data in "Add Rlease" form.
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
            script.addEventListener('load', function(){
                document.head.appendChild(cb);
            });
        } else {
            var dollar = undefined;
            if (typeof($) != "undefined") dollar = $;
            script.addEventListener('load', function(){
                jQuery.noConflict();
                $ = dollar;
                callback(jQuery, window);
            });
        }
        document.head.appendChild(script);
    } else {
        console.log('Using jquery ' + jQuery().jquery);
        setTimeout(function(){
            //Firefox supports
            console.log('Runing custom script');
            callback(jQuery, typeof(unsafeWindow) == "undefined" ? window : unsafeWindow);
        }, 30);
    }
}

// the guts of this userscript
withjQuery(function($, window) {
    // helper functions
    // local storage
    var IStorage = function(prefix){
        var pref = prefix + '.';
        var addpref = function(key) { return pref + key; };
        this.get = function(key, def){
            var val = window.localStorage.getItem(addpref(key));
            return val || def || null;
        };
        this.set = function(key, val){
            window.localStorage.setItem(addpref(key), val);
        };
        this.flush = function(){
            window.localStorage.clear();
        };
        this.getObject = function(key, def){
            var val = this.get(key);
            return val ? JSON.parse(val) : (def || null);
        };
        this.setObject = function(key, val){
            this.set(key, JSON.stringify(val));
        };
    };

    // replace main menu [Project]
    function redirectToProjectListPage(obj) {
        obj.attr('href', '/projectManage/ProjectList.asp');
    }
    redirectToProjectListPage($('li#mainMenuItem_150000 a'));

    // operate w.r.t. sub path
    var subpath = window.location.pathname.split('?')[0]
    if (subpath == '/index2014/index.asp') {
        console.log('Index2014');
        redirectToProjectListPage($('div#headerTopDiv div a:nth-child(2)'));
    } else if (subpath == '/projectManage/ProjectList.asp') {
        console.log('ProjectList');
        var trs = $('table.ListTable tbody tr');
        trs.first().find('th:nth-child(2)').after('<th>Operations</th>');
        trs.nextAll().each(function(){
            var id = $(this).find('td:first a:first').text();
            var rlsUrl = 'ProjectOther/ReleaseList.asp?proj_id=' + id
            var link = '<a href="' + rlsUrl + '">Release</a>'
            $(this).find('td:nth-child(2)').after('<td>' + link + '</td>');
        });
    } else if (subpath == '/projectManage/ProjectOther/ReleaseList.asp') {
        console.log('ReleaseList');
        // invert table row
        btn = $('<input type="button" value="Invert Rows"/>');
        //btn.appendTo($("body"));
        btn.insertBefore($("input[type='button']"));
        btn.click(function(){
            $('table.ResultTable tbody').each(function(elem, index){
                var arr = $.makeArray($("tr", this).detach());
                var th = arr.shift();
                arr.reverse();
                arr.unshift(th);
                $(this).append(arr);
            });
        });
        btn.click();
    } else if (subpath == '/projectManage/ProjectOther/addRelease.asp') {
        console.log('addRelease');
        var istore = new IStorage('addRelease');
        // related project IDs
        var IDManager = function(db) {
            var storeid = 'IDs';
            var idb = db;
            var cb = function(){};
            this.data = {};
            this.load = function(){
                this.data = idb.getObject(storeid, {});
                cb(this.data);
                return this;
            };
            this.save = function(){
                idb.setObject(storeid, this.data);
                return this;
            };
            this.add = function(id, name){
                if (!(id in this.data)) {
                    this.data[id] = {name: name};
                    cb(this.data);
                }
                return this;
            };
            this.set = function(id, name){
                if (id in this.data) {
                    this.data[id] = {name: name};
                }
                return this;
            };
            this.remove = function(id){
                if (id in this.data) {
                    delete this.data[id];
                    cb(this.data);
                }
                return this;
            };
            this.clear = function(id){
                if (this.data) {
                    this.data = {};
                    cb(this.data);
                }
                return this;
            };
            this.change = function(callback) {
                var oldcb = cb;
                cb = function(data){ oldcb(data); callback(data); }
                return this;
            };
            this.check = function(id, callback){
                if (/^[0-9]{4}$/.test(id)) {
                    var url = '../ProjectDelivery/delivery_releated_project_list.asp';
                    $.get(url, {projid: id}, function(data, status){
                        name = $(data).find('td:nth-child(2)').text();
                        proj_status = $(data).find('td:nth-child(3)').text();
                        if (status == 'success' && callback)
                            callback(name, id, proj_status);
                        else
                            callback();
                    });
                } else {
                    callback();
                }
                return this;
            };
        };
        var idmgr = new IDManager(istore);
        // date
        var d = new Date();
        $('input#txtDate').val(d.getFullYear() + '/' + d.getMonth() + '/' + d.getDay());
        // release package
        $('input#txtDeliveryPackage').change(function(){
            var val = $(this).val();
            var vers = /(\d+)\.(\d+)\.\d+\.(\d+)/g.exec(val);
            if (vers == null)
                vers = /(\d+)\.(\d+)\.(\d+)/g.exec(val);
            if (vers) {
                vstr = 'v' + [vers[1], vers[2], vers[3]].join('.')
                $("input[name='txtVersion']").val(vstr);
            }
        }).val(istore.get('package')).css({
            'width': '100%',
        });
        $('input#txtReleasePath').val(istore.get('releasepath')).css({
            'width': '100%',
        });
        $("input[name='txtVersion']").val(istore.get('version'));
        // related project
        // create table
        $(function(){
            var table = $('<table>' +
                          '<thead><tr><td style="width:40px">ID</td><td>Name</td><td style="width:60px">Operation</td></tr></thead>' +
                          '<tbody></tbody>' +
                          '<tfoot>' +
                              '<tr><td><input id="inputID" type="text" size="4"/></td>' +
                              '<td id="inputIDtxt">Clicking "Add" to add item</td>' +
                              '<td><input id="addID" type="button" value="Add"/></td></tr>' +
                              '<tr><td/><td>Clear all saved data</td>' +
                              '<td><input id="flushIDs" type="button" value="Flush"/></td></tr>' +
                          '</tfoot>' +
                          '</table>').insertAfter($('input#btnCheckReleatedProject').next());
            table.css({
                width: '100%',
            });
            idmgr.change(function(data){
                table.find('tbody').each(function(){
                    $(this).empty();
                    // insert exist items
                    for (var id in data) {
                        var val = data[id];
                        $('<tr><td class=projId>' + id + '</td>' +
                          '<td class="projIdName">' + val['name'] + '</td>' +
                          '<td><input id="delID" type="button" value="Del"/></td></tr>').appendTo($(this));
                    }
                });
            }).load();
            table.find('tbody').delegate('input#delID', 'click', function(){
                var id = $(this).parent().prev().prev().text();
                idmgr.remove(id);
            }).delegate('td.projIdName', 'click', function(){
                if ($(this).find('input').length) return;
                var oldval = $(this).text();
                $(this).addClass('cellEditing');
                $(this).empty();
                var input = $('<input type="text", value="' + oldval + '"/>');
                input.appendTo($(this)).focus().keypress(function(e){
                    if (e.which == 13) {
                        // enter
                        var id = $(this).parent().prev().text();
                        var newval = $(this).val();
                        $(this).parent().text(newval);
                        idmgr.set(id, newval);
                    }
                }).blur(function(){
                    $(this).parent().text(oldval);
                }).css({
                    width: '100%',
                });
            }).delegate('td.projId', 'click', function(){
                var id = $(this).text();
                $("input[name='txtReleaseReleatedProject']").val(id).keyup();
            });
            table.find('input#inputID').keyup(function(e){
                if (e.which == 13) {
                    $(this).parent().nextAll().find('input#addID').click();
                    return;
                }
                idmgr.check($(this).val(), function(name){
                    table.find('td#inputIDtxt').text(name || '');
                });
            });
            table.find('input#addID').click(function(){
                var id = table.find('input#inputID').val();
                var name = table.find('td#inputIDtxt').text();
                if (id && name) {
                    idmgr.add(id, name);
                }
            });
            table.find('input#flushIDs').click(function(){
                idmgr.clear();
            });
        });
        $("input[name='txtReleaseReleatedProject']").keyup(function(){
            var id = $(this).val();
            var msgdiv = $('input#btnCheckReleatedProject').next();
            idmgr.check(id, function(name){
                if (name)
                    msgdiv.html(name);
                else
                    msgdiv.html('<font color="#FF0000">No project found</font>');
            });
        }).val(istore.get('relatedProjectID')).keyup();
        // notes
        $('textarea#txtNotes').val(istore.get('note')).css({
            width: '100%',
            height: '80px',
        });
        // save result before close window
        $(window).unload(function(){
            console.log('window closing');
            istore.set('relatedProjectID', $("input[name='txtReleaseReleatedProject']").val());
            istore.set('note', $('textarea#txtNotes').val());
            istore.set('package', $('input#txtDeliveryPackage').val());
            istore.set('releasepath', $('input#txtReleasePath').val());
            istore.set('version', $("input[name='txtVersion']").val());
            idmgr.save();
        });
    }
}, true);
