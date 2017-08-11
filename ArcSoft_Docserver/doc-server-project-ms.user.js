// ==UserScript==
// @name        ArcSoft Docserver
// @version     22
// @author      maxint <NOT_SPAM_lnychina@gmail.com>
// @namespace   http://maxint.github.io
// @description An enhancement for Arcsoft office server in http://doc-server
// @include     http://doc-server/*
// @include     https://doc-server/*
// @include     http://hz-delivery/ImageTECH/*
// @updateURL   https://raw.githubusercontent.com/maxint/userjs/master/ArcSoft_Docserver/doc-server-project-ms.user.js
// @downloadURL https://raw.githubusercontent.com/maxint/userjs/master/ArcSoft_Docserver/doc-server-project-ms.user.js
// @grant       none
// @Note
// v22
//  - Set different versions for different packages.
//
// v21
//  - Update post URL when commit "Release".
//
// v20
//  - Add support of new project id's.
//
// v19
//  - Multiple-line view for attendance list.
//
// v18
//  - Remove "Small Delivery" button.
//
// v17
//  - Add "Delvery" and "Small Delivery" buttons to project table.
//
// v16
//  - Add delivery package selection in "Delivery"" page.
//
// v15
//  - Fix bug of un-selected project id.
//  - Confirm project id input by space.
//
// v14
//  - Save project data individually in "Release" page and new data copies from old one when first time access.
//
// v13
//  - Do not "Invert Rows" by default.
//  - Confirm project id's by period when input.
//
// v12
//  - Add "Show Release To" button to show names of "release to" projects.
//
// v11
//  - Disable the target onchange event and select the last target by default
//    in http://doc-server/HRInfo/TrainingSpace/FeedbackEdit.asp.
//
// v10
//  - Fix bug of loading failed in 360 browser.
//
// v9
//  - Lazy load jQuery UI when really needed.
//  - Fix bug: unable to delete ID.
//
// v8
//  - Add "Version Format" setting dialog.
//
// v7
//  - Fix bug of using "for in" loop for Array.
//  - Filter empty package path.
//
// v6
//  - Fix bug of Object.keys() in Chrome.
//
// v5
//  - Fix bug of no response in Firefox.
//  - Sort project Ids.
//
// v4
//  - Fix bug of wrong id in Chrome.
//
// v3
//  - Update id checkboxes w.r.t. keyboard input.
//  - Sort project id rows w.r.t. checked statuses.
//  - Add input project id automatically.
//
// v2
//  - Fix bug of pause when multiple delivery packages.
//  - Add checkboxes to project id table.
//
// v1
//  - Add support for delivery multiple packages to multiple projects at one time.
//
// v0.0.9
//  - Add https support.
//  - Add "Release" column to "/index2014/Engineering/index.asp" page.
//
// v0.0.8
//  - Add partial auto fill support for "Edit" window.
//  - Add message alert when flushing project IDs.
//  - Fix bug of "Invert Rows" caused by web page update.
//
// v0.0.7
//  - Update @updateURL and @downloadURL.
//  - Add support for "Edit" in "Add Release Page".
//
// v0.0.6
//  - Fix bug of date format.
//
// v0.0.5
//  - Login page: login when press <Enter> in password input.
//
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
; (function (callback, safe) {
    "use strict";
    var callback2 = function (jQuery_old, jQuery) {
        //Firefox supports
        console.log('[I] Using jquery ' + jQuery().jquery);
        console.log('[I] Runing custom script');
        callback(jQuery_old, jQuery, typeof(unsafeWindow) === "undefined" ? window : unsafeWindow);
    };
    if (typeof(jQuery) === "undefined" || jQuery.jquery !== '2.1.1') {
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

    // replace main menu [Project]
    function redirectToProjectListPage(obj) {
        obj.prop('href', '/projectManage/ProjectList.asp');
    }
    redirectToProjectListPage($('li#mainMenuItem_150000 a'));

    // add "Release" column in second row of table
    function addReleaseToTable(table) {
        var trs = table.find('tbody tr');
        trs.first().find('th:nth-child(2)').after('<th>Operations</th>');
        trs.nextAll().each(function () {
            let id = $(this).find('td:first a:first').text();
            let rlsUrl = 'http://doc-server/projectManage/ProjectOther/ReleaseList.asp?proj_id=' + id;
            let dlrUrl = 'http://doc-server/projectManage/ProjectDelivery/delivery_phase_plan.asp?keyid=0&status=20&projid=' + id;
            let link = '<a title="Release" href="' + rlsUrl + '">R</a>';
            link += ' / <a title="Delivery" href="' + dlrUrl + '">D</a>';
            $(this).find('td:nth-child(2)').after('<td>' + link + '</td>');
        });
    }

    // fill input values
    function fillValues(key_id_pairs, istore) {
        for (var key in key_id_pairs) {
            if (key_id_pairs.hasOwnProperty(key)) {
                var elem = key_id_pairs[key];
                if (!elem.val())
                    elem.val(istore.get(key, ''));
            }
        }
    }
    // save input values
    function storeValues(key_id_pairs, istore) {
        for (var key in key_id_pairs) {
            if (key_id_pairs.hasOwnProperty(key)) {
                istore.set(key, key_id_pairs[key].val());
            }
        }
    }

    // check id
    function checkID(id) {
        return /^\d{4,5}-?\d?$/.test(id);
    }

    // query id
    function queryID(id, callback) {
        var url = '../ProjectDelivery/delivery_releated_project_list.asp';
        $.get(url, {projid: id}, function (data, status) {
            var name = $(data).find('td:nth-child(2)').text();
            if (status == 'success' && name !== "" && callback) {
                var proj_status = $(data).find('td:nth-child(3)').text();
                callback(id, name, proj_status);
            } else {
                callback(id);
            }
        });
    }

    // get parameter by name from URL
    function getParameterByName(url, name, def) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        let regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        let results = regex.exec(url);
        return results === null ? def : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    // float contact window
    function createFloatContactWindow() {
        console.log('[I] Create float contact window');
        let floatDiv = $('<div id="floatContactDiv"><div>author: maxint</div><div>skype: <a href="skype:maxint_5?add">maxint_5</a></div></div>').css({
            "position": 'absolute',
            "background": "white",
            "margin": "50px 20px",
            "padding": "10px",
        });
        $('body').append(floatDiv);
        $(window).scroll(function () {
           let pos = $(document).scrollTop() + "px";
           $('#floatContactDiv').animate({top: pos}, {duration: 1000, queue: false});
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    // page routines
    if (window.location.hostname == 'hz-delivery') {
        console.log('[I] Open hz-delivery page');
        let is_reformat = getParameterByName(window.location.search, 'reformat');
        if (is_reformat == null) return;
        let pre_object = $('body > pre');
        let html = pre_object.html();
        let lines = html.split('<br>');
        let item_pattern = /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})\s+(\d+)\s+<a href="([^"]+)">([^<]+)/;
        let items = [];
        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i].trim();
            if (line.length == 0) {
                continue;
            }
            let m = item_pattern.exec(line);
            //console.log(line);
            if (m !== null && /\.(zip|ZIP)$/.test(m[8])) { // only add ZIP files
                items.push({
                    date: new Date(m[1], m[2], m[3], m[4], m[5]),
                    size: parseInt(m[6]),
                    name: m[8],
                    url: m[7],
                });
            }
        }
        // sort by date in descending order
        items.sort(function(lhs, rhs) {
            return lhs.date < rhs.date;
        });
        let max_count = Math.min(items.length, getParameterByName(window.location.search, 'max_count', 8));
        let new_html = '<form>';
        for (let i = 0; i < max_count; ++i) {
            let item = items[i];
            new_html += '<input type="radio" name="package" id="' + item.name + '">' + item.name + '<br>';
        }
        new_html += '</form>';
        $('hr').remove();
        $('h1').remove();
        pre_object.html(new_html);
        $(':radio:first').prop('checked', true);
        $(':radio').click(function() {
            //console.log(this);
            //console.log(window.parent);
            window.parent.postMessage(this.id, '*');
        });
        window.addEventListener("message", function(e) {
            console.log(e);
        }, false);
        return;
    }

    // operate w.r.t. sub path
    var subpath = window.location.pathname;
    if (subpath == '/login.asp') {
        $('input#password').keyup(function (e) {
            if (e.which == 13) {
                $('input[value="Login"]').click();
            }
        });
    } else if (subpath == '/index2014/index.asp') {
        console.log('[I] Open new home page');
        redirectToProjectListPage($('div#headerTopDiv div a:nth-child(2)'));
    } else if (subpath == '/projectManage/ProjectList.asp') {
        console.log('[I] Open ProjectList page');
        addReleaseToTable($('table.ListTable'));
    } else if (subpath == '/index2014/Engineering/index.asp') {
        console.log('[I] Open Engineering page');
        addReleaseToTable($('#workspace table:first'));
    } else if (subpath == '/hrinfo/attendance/viewRecord.asp' ||
               subpath == '/hrinfo/attendance/viewrecord.asp') {
        console.log('[I] Open attendance page');
        $('table#tMainText tbody').each(function (index, elem) {
            let titles = $("tr:first-child th", this);
            let values = $("tr:last-child td", this);
            $('tr', this).detach();
            assert(titles.length == values.length);
            let total = titles.length - 1;
            let segment_len = 7;
            let segment_num = total / segment_len;
            for (let i = 0; i < segment_num; ++i) {
                let cur_segment_len = Math.min(total - i*segment_len, segment_len);
                let tr1 = $('<tr></tr>');
                let tr2 = $('<tr></tr>');
                for (let k = 0; k < cur_segment_len; ++k) {
                    let idx = i * segment_len + k + 1;
                    tr1.append(titles[idx]);
                    tr2.append(values[idx]);
                }
                $(this).append(tr1);
                $(this).append(tr2);
            }
        });
    } else if (subpath == '/projectManage/ProjectDelivery/delivery_plan.asp') {
        var d = new Date();
        $('input#DeliverDate').val(d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate());
    } else if (subpath == '/projectManage/ProjectDelivery/delivery_codingreport.asp' ||
               subpath == '/projectManage/ProjectDelivery/delivery_codingreport_update.asp') {
        console.log('[I] Open delivery page');
        var id = $('#projectid').val();
        var istore = new IStorage('project#' + id);
        var key_id_pairs = {
            'svn_path': $('input#SourceCodePath'),
            'last_tag': $('input#SOSLabel'),
            'hzpm_notes': $('textarea#hzpm_notes'),
        };
        fillValues(key_id_pairs, istore);
        $(window).unload(function () {
            console.log('[I] Window unload');
            storeValues(key_id_pairs, istore);
        });
        // replace delivery URL
        let delivery_href_a = $('#act_hzdelivery + a');
        let delivery_url = delivery_href_a.attr('href');
        let delivery_new_url = 'http:' + delivery_url.replace(/\\/g, '/');
        delivery_href_a.attr('href', delivery_new_url);
        delivery_new_url = delivery_new_url + '?reformat=1';
        let delivery_frame = $('<iframe id="delivery_page" src="' + delivery_new_url + '"></iframe>').css({
            'width': '100%',
            'height': '100%',
            'border': '0'
        });
        $('#table4').append(delivery_frame);
        window.addEventListener("message", function(e) {
            //console.log(e);
            if (e.origin === 'http://hz-delivery') {
                $('input#file_name').val(e.data);
            }
        }, false);
        setTimeout(function() {
            delivery_frame[0].contentWindow.postMessage('message from doc-server', '*');
        }, 1000);
    } else if (subpath == '/projectManage/ProjectOther/ReleaseList.asp') {
        console.log('[I] Open ReleaseList page');
        //createFloatContactWindow();
        if (window.location.protocol == 'https:') {
            console.log('[W] Redirecting to http ...');
            window.location.replace(window.location.href.replace('https://', 'http://'));
            return;
        }
        // invert table row
        $('<input type="button" value="Invert Rows"/>').insertBefore($("input[type='button']")).click(function () {
            $('table.ListTable tbody').each(function (index, elem) {
                var arr = $.makeArray($("tr", this).detach());
                var th = arr.shift();
                arr.reverse();
                arr.unshift(th);
                $(this).append(arr);
            });
        });
        // show release to
        $('<input type="button" value="Show Release To"/>').insertBefore($("input[type='button']").first()).click(function (){
            this.disabled = true;
            $('table.ListTable tbody tr.status_1 td:nth-child(4)').each(function (index, elem) {
                var a = elem.getElementsByTagName('a')[0];
                var id = a.innerHTML;
                queryID(id, function (id, name, proj_status) {
                    a.innerHTML = name + ' (' + id + ')';
                });
            });
        });
    } else if (subpath == '/projectManage/ProjectOther/addRelease.asp') {
        var proj_id = /\?proj_id=(\d{4,5}-?\d?)/.exec(window.location.href)[1];
        console.log('[I] Open addRelease page with project id: ' + proj_id);
        var istore = new IStorage('addRelease#' + proj_id);
        // copy old data
        //console.log(window.localStorage);istore.clear();
        istore.copyFrom(new IStorage('addRelease'));
        // related project IDs
        var IDManager = function (db) {
            var storeid = 'IDs';
            var idb = db;
            var cb = function () {};
            this.data = {};
            this.load = function () {
                this.data = idb.getObject(storeid, {});
                cb(this.data);
                return this;
            };
            this.save = function () {
                idb.setObject(storeid, this.data);
                return this;
            };
            this.contains = function (id) {
                return id in this.data;
            };
            this.add = function (id, name) {
                assert(checkID(id));
                if (!this.contains(id)) {
                    this.data[id] = {name: name};
                    cb(this.data);
                }
                return this;
            };
            this.set = function (id, name) {
                if (this.contains(id)) {
                    this.data[id] = {name: name};
                }
                return this;
            };
            this.remove = function (id) {
                if (this.contains(id)) {
                    delete this.data[id];
                    cb(this.data);
                }
                return this;
            };
            this.clear = function (id) {
                if (this.data) {
                    this.data = {};
                    cb(this.data);
                }
                return this;
            };
            this.change = function (callback) {
                var oldcb = cb;
                cb = function (data) { oldcb(data); callback(data); };
                return this;
            };
            this.check = function (id, callback) {
                if (checkID(id)) {
                    queryID(id, callback);
                } else {
                    callback();
                }
                return this;
            };
        };
        // parse version number
        var default_version_fmt = '${major}.${minor}.${platform}.${build}';
        var parseVersionNumber = function(val) {
            var vers = /(\d+)\.(\d+)\.(\d+)\.(\d+)/g.exec(val);
            if (vers === null) {
                vers = /(\d+)\.(\d+)\.(\d+)/g.exec(val);
                if (vers)
                    vers.splice(3, '0');
            }
            if (vers) {
                var vstr = istore.get('version.format', default_version_fmt) || '';
                vstr = vstr.replace('${major}', vers[1]);
                vstr = vstr.replace('${minor}', vers[2]);
                vstr = vstr.replace('${platform}', vers[3]);
                vstr = vstr.replace('${build}', vers[4]);
                return vstr;
            } else {
                return null;
            }
        };
        var idmgr = new IDManager(istore);
        if (window.location.search.indexOf('IdentityID=') == -1) {
            // date
            var d = new Date();
            $('input#txtDate').val(d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate());
            // create packages textarea
            var packagesTextArea = $('<textarea id="txtDeliveryPackages"></textarea>').css({
                'width': '100%',
                'height': '80px',
            });
            $('input#txtDeliveryPackage').hide().siblings('input').hide().last().after(packagesTextArea);
            packagesTextArea.next().each(function () {
                $(this).html('请输入递交包文件名，支持多个文件一起提交，每行一个文件名。');
            });
            // fill previous data
            var key_id_pairs = {
                'version': $("input[name='txtVersion']"),
                'releasepath': $('input#txtReleasePath'),
                'package': $('input#txtDeliveryPackage'),
                'packages': $('textarea#txtDeliveryPackages'),
                'relatedProjectID': $("input[name='txtReleaseReleatedProject']"),
                'note': $('textarea#txtNotes'),
            };
            fillValues(key_id_pairs, istore);
            // save result before close window
            $(window).unload(function () {
                console.log('[I] Window closing');
                storeValues(key_id_pairs, istore);
                idmgr.save();
            });
            // submit
            $('#btnSubmit').removeAttr('onclick').click(function () {
                // check form
                console.log('[I] Checking form ...');
                if (!(function () {
                    if ($("#txtReleaseType").val() == "1") {
                        //先进行校验是否填写了相关项目,如果填写了,同时校验规则 是否正确.
                        var selected = $("#txtReleaseReleatedProject").val();
                        if (selected === "") {
                            alert("项目号格式不能为空");
                            $("#txtReleaseReleatedProject").focus();
                            return false;
                        } else {
                            /* 检验是否符合输入规则.*/
                            if (!selected.split(',').every(checkID)) {
                                $("#txtReleaseReleatedProject").focus();
                                alert("项目号格式不对");
                                return false;
                            }
                            return true;
                        }
                    }
                })()) return;
                var pkgs = packagesTextArea.val().split('\n').map(function (s) {
                    return s.trim();
                }).filter(function (s) { return s !== ''; });
                for (var i = 0; i < pkgs.length; ++i) {
                    var pkg = pkgs[i];
                    $('input#txtReleasePath,input#txtDeliveryPackage').val(pkg);
                    $("input[name='txtVersion']").val(parseVersionNumber(pkg));
                    if (!jq('#form1').valid()) {
                        alert('提交包列表格式不对');
                        return;
                    }
                }
                // disable the form to avoid user interaction when subcomt
                $(this).prop('disabled', true);
                // submit
                for (var i = 0; i < pkgs.length; ++i) {
                    var pkg = pkgs[i];
                    console.log('[I] Submitting "' + pkg + '" ...');
                    $('input#txtReleasePath,input#txtDeliveryPackage').val(pkg);
                    $("input[name='txtVersion']").val(parseVersionNumber(pkg));
                    var qstr = jq('#form1').formSerialize();
                    $.post('/MVCPortal/ProjectManage/ProjectOther/ProjectRelease?IsTest=false', qstr, function (data) {
                        if (data.msg != "success")
                            alert(data.msg);
                    });
                }
                alert("提交成功");
                parent.document.location.reload();
            });
        }
        // update version
        var pkgInputs = $('#txtDeliveryPackage,#txtDeliveryPackages').change(function () {
            var vstr = parseVersionNumber(this.value);
            if (vstr) {
                console.log('[I] Current version format: ' + vstr);
                $("input[name='txtVersion']").val(vstr);
            }
        }).css({
            'width': '100%',
        }).change();
        $('<input type="button" value="Version Format"/>').appendTo($("input[name='txtVersion']").parent()).click(function () {
            if ($('#version-format-dialog').length === 0) {
                var fmt = istore.get('version.format', default_version_fmt);
                $('<div id="version-format-dialog" title="设置版本格式">' +
                  '  <p class="validateTips">可用的变量：${major}, ${minor}, ${platform}, ${build}</p>' +
                  '  <form>' +
                  '  <fieldset>' +
                  '    <label for="name">格式</label>' +
                  '    <input type="text" name="format" id="format" class="text ui-widget-content ui-corner-all">' +
                  '  </fieldset>' +
                  '  </form>' +
                  '</div>').appendTo(document.body).find('input#format').css({
                    'width':  '300',
                }).val(fmt);
            }
            var showDialog = function() {
                $('#version-format-dialog').dialog({
                    autoOpen: true,
                    width: 400,
                    modal: true,
                    buttons: {
                        '默认': function() {
                            format.value = default_version_fmt;
                            istore.set('version.format', default_version_fmt);
                        },
                        '确定': function() {
                            if (format.value != fmt) {
                                console.log('[I] Set version format to: ' + format.value);
                                istore.set('version.format', format.value);
                                pkgInputs.change();
                            }
                            $(this).dialog('close');
                        },
                        '关闭': function() {
                            $(this).dialog('close');
                        }
                    }
                });
            };
            if ($.ui) {
                showDialog();
            } else {
                $("head").append('<link rel="stylesheet" href="//apps.bdimg.com/libs/jqueryui/1.10.4/css/jquery-ui.min.css">');
                $.getScript("//apps.bdimg.com/libs/jqueryui/1.10.4/jquery-ui.min.js", showDialog);
            }
        });
        // release package
        $('input#txtReleasePath').css({
            'width': '100%',
        });
        // related project table
        $(function () {
            var table = $('<table>' +
                          '<thead><tr style="width:10px">' +
                          '<td><input id="selectAllIDs" type="checkbox"></td><td style="width:40px">ID</td><td>Name</td><td style="width:60px">Operation</td>' +
                          '</tr></thead>' +
                          '<tbody></tbody>' +
                          '<tfoot>' +
                          '<tr><td/>' +
                          '<td><input id="inputID" type="text" maxlength="4" size="4"/></td>' +
                          '<td id="inputIDtxt" class="projIdName">Clicking "Add" to add item</td>' +
                          '<td><input id="addID" type="button" value="Add" disabled="true"/></td></tr>' +
                          '<tr><td/><td/><td>Clear all saved project IDs</td>' +
                          '<td><input id="flushIDs" type="button" value="Flush"/></td></tr>' +
                          '</tfoot>' +
                          '</table>').css({ width: '100%' });
            $('input#btnCheckReleatedProject').after('<div class="info">多个项目号以逗号分隔，当手动输入时以空格或句号结尾。</div>').next().next().after(table);
            // update check states of check boxes
            var updateCheckBoxes = function() {
                var checked = table.find('tbody input:checked').length;
                var total = table.find('tbody input:checkbox').length;
                table.find('input#selectAllIDs').each(function () {
                    this.indeterminate = checked != total && checked !== 0;
                    if (!this.indeterminate)
                        this.checked = checked == total && total !== 0;
                });
            };
            var selectRelatedProjects = function(s) {
                var selected = s.trim().split(',');
                var obj = $("input[name='txtReleaseReleatedProject']");
                if (s.length === 0 || selected.every(checkID)) {
                    console.log('[I] Selected project IDs: ' + selected);
                    $(':checkbox', table).prop('checked', false);
                    for (var i=0; i < selected.length; ++i) {
                        var id = selected[i];
                        if (!idmgr.contains(id)) {
                            idmgr.check(id, function (id, name) {
                                if (name) {
                                    idmgr.add(id, name);
                                }
                            });
                        }
                        $('#proj_' + id + ' :checkbox', table).prop('checked', true);
                    }
                    // move checked IDs to the front
                    if (selected.length !== 0)
                        $('tbody input:checked', table).parent().parent().detach().prependTo($('tbody', table));
                    updateCheckBoxes();
                    obj.css({ 'background-color': 'transparent' });
                } else {
                    obj.css({ 'background-color': "#FAA" });
                }
            };
            // detete id input box
            var projectIdInput = $("input[name='txtReleaseReleatedProject']").keyup(function () {
                var s = this.value.replace(/^\s+/, ''); // left trim
                if (s.length > 0) {
                    var ch = s[s.length-1];
                    if (ch !== '.' && ch !== ' ') return;
                    s = s.substr(0, s.length-1);
                    this.value = s;
                }
                selectRelatedProjects(s);
            });
            idmgr.change(function (data) {
                table.find('tbody').each(function () {
                    $(this).empty();
                    // insert items
                    var keys = Object.keys(data);
                    keys.sort();
                    for (var i in keys) {
                        var id = keys[i];
                        if (checkID(id)) {
                            var val = data[id];
                            $('<tr id=proj_' + id + '>' +
                              '<td><input type="checkbox"></td>' +
                              '<td>' + id + '</td>' +
                              '<td class="projIdName">' + val.name + '</td>' +
                              '<td><input id="delID" type="button" value="Del"/></td></tr>').appendTo($(this));
                        }
                    }
                    selectRelatedProjects(projectIdInput.val());
                });
            }).load();
            table.find('tbody').delegate('input#delID', 'click', function () {
                var id = $(this).parent().prev().prev().text();
                console.log('[I] Delete project ID: ' + id);
                // remove id from selected input
                var selected = projectIdInput.val().trim().split(',').remove(id);
                projectIdInput.val(selected.join(','));
                idmgr.remove(id);
            });
            table.delegate(':checkbox', 'click', function() {
                var ids = [];
                table.find('tbody input:checked').parent().next().each(function() {
                    ids.push($(this).text());
                });
                projectIdInput.val(ids.join(','));
                updateCheckBoxes();
            }).delegate('td.projIdName', 'click', function () {
                if ($(this).find('input').length) return;
                var oldval = $(this).text();
                $(this).addClass('cellEditing');
                $(this).empty();
                var input = $('<input type="text"/>').val(oldval);
                input.appendTo($(this)).focus().keypress(function (e) {
                    if (e.which == 13) {
                        // enter
                        var id = $(this).parent().prev().text();
                        var newval = $(this).val();
                        $(this).parent().text(newval);
                        idmgr.set(id, newval);
                    }
                }).blur(function () {
                    $(this).parent().text(oldval);
                }).css({
                    width: '100%',
                });
            }).find('input#selectAllIDs').click(function () {
                table.find(':checkbox').prop('checked', this.checked);
            });
            table.find('tfoot').delegate('input#inputID', 'keyup', function (e) {
                var addButton = $('input#addID', table);
                if (e.which == 13 && !addButton.prop('disabled')) {
                    addButton.click();
                    return;
                }
                idmgr.check(this.value, function (name) {
                    table.find('td#inputIDtxt').html(name || '<font color="#FF0000">[Invalid project id]</font>');
                    addButton.prop('disabled', name === undefined);
                });
            }).delegate('input#addID', 'click', function () {
                var id = table.find('input#inputID').val();
                var name = table.find('td#inputIDtxt').text();
                console.log('[I] Add project: ' + id +', ' + name);
                idmgr.add(id, name);
            }).delegate('input#flushIDs', 'click', function () {
                if (confirm('Delete all project IDs?')) {
                    idmgr.clear();
                }
            });
        });
        // notes
        $('textarea#txtNotes').css({
            width: '100%',
            height: '80px',
        });
    } else if (subpath == '/HRInfo/TrainingSpace/FeedbackEdit.asp') {
        // save all form data
        $('form select#Target').removeAttr('onchange').find('option:last').attr('selected', 'selected');
        console.log('[I] Select the last option and remove onchange event of forms');
    }
}, true);

// vim: ts=4 sts=4 sw=4 et
