define([
    "jquery",
    "underscore",
    "storage",
    "classes/Extension",
    "text!html/buttonAggDocSave.html",
    "text!html/buttonAggDocSettings.html",
    "fileSystem",
], function($, _, storage, Extension, buttonAggDocHTML, buttonAggDocSettingsHTML, fileSystem) {
    var _defaultDocInfo = {},_defaultUserInfo;

    var buttonAggDoc = new Extension("buttonAggDoc", 'Save Document', true, true);
    var $createDocAggName, $createDocAggDocTitle, $fileTitleNavbar, $documentList, $fileAggnameNavbar;

    var _formatDoc = function(data) {
        return {
            _id: data._id || '', // 文档mongoId
            title: data.title || '', // 文档Title
            creator: data.creator || _defaultUserInfo.name, // 文档作者
            aggName: data.category || '', // 文档所属AGG
            content: data.mdContent || '', // 文档markdown内容
            updateTime: data.updateTime || ''// 文档更新时间
        };
    };

    var _getDocumentList = function(){
        // 过滤缓存文件，如果文档中有aggName,title,_id的才显示出来
        var aggDocList,aggDocListHTML = "";
        var documentEltTmpl = [
            '<li><a',
            ' class="list-group-item<%= fileDesc._id === selectedId ? " active" : "" %>"',
            ' href="/agg/doc?name=<%= fileDesc.aggName %>&doc=<%= fileDesc.aggName + "/" + fileDesc.title %>">',
            '   <%= fileDesc.aggName + "/" + fileDesc.composeTitle() %>',
            '</a></li>',
        ].join('');

        aggDocList = _.filter(fileSystem, function(fileDesc) {
            // 缓存文件和默认文件的aggName、title、_id完全一致
            if (fileDesc.fileType == 'agg' ) {
                return true;
            }
        });

        _.forEach(aggDocList, function(item){
            aggDocListHTML += _.template(documentEltTmpl, {
                fileDesc: item,
                selectedId: _defaultDocInfo._id
            });
        });


        aggDocListHTML  = '<ul class="nav">' + aggDocListHTML + '</ul>';

        return aggDocListHTML;
    };

    /*
     * 提交文档
     */
    var _submitDoc = function(fileDesc, callback) {
        callback = callback || function(res) {
            console.log('>>>更新文档结果', res);
            // 更新当前提交时间
            _defaultDocInfo.updateTime = res.data.updateTime;
            eventMgr.onMessage('更新文档成功！');
        };

        // 生成基本数据
        var postData = {
            _id         : _defaultDocInfo._id || undefined,
            title       : _defaultDocInfo.title,
            category    : _defaultDocInfo.aggName,
            creator     : _defaultDocInfo.creator,
            curUpdateTime   : _defaultDocInfo.updateTime,

            mdContent   : fileDesc.content, // 文档markdown格式内容
            htmlContent : htmlWithoutComments // 文档html格式内容
        };

        var postUrl;
        if (postData._id) {
            postUrl = '/aj/agg/editdoc';
        }else{
            postUrl = '/aj/agg/newdoc';
        }

        $.post(postUrl, postData, function(res) {
            if (res.code === "0") {
                callback(res);
            }else{
                eventMgr.onError(res.msg || '更新文档出错，请稍后再试。');
            }
        }, 'JSON');
    };

    /*
     * 通过默认数据打开文档
     */
    var _openDefaultDoc = function() {
        var curFileDesc, aggDocList;
        
        aggDocList = _.filter(fileSystem, function(fileDesc) {
            // 查看文件缓存中是否存在_id一致的文档
            if ( fileDesc.fileType == 'agg' && fileDesc._id == _defaultDocInfo._id ) {
                return true;
            }
        });

        // 如果本地有对应id的文档就更新文档内容后，选择本地文档
        if(aggDocList.length > 0){
            aggDocList[0].content = _defaultDocInfo.content || aggDocList[0].content;
            aggDocList[0].title = _defaultDocInfo.title;

            fileMgr.selectFile(aggDocList[0]);
        }else{
            setTimeout(function() {
                // 创建文件
                curFileDesc = fileMgr.createFile({
                    fileType: 'agg',
                    title: _defaultDocInfo.title,
                    _id: _defaultDocInfo._id,
                    aggName: _defaultDocInfo.aggName,
                    content: _defaultDocInfo.content
                });

                fileMgr.selectFile(curFileDesc);
            }, 100);
        }
    };

    if (window.Meilishuo && window.Meilishuo.constant && window.Meilishuo.constant) {
        _defaultUserInfo = window.Meilishuo.constant.userInfo || {};
        _defaultDocInfo = _formatDoc(window.Meilishuo.constant.docInfo||{});
    }

    var eventMgr;
    buttonAggDoc.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    var fileMgr;
    buttonAggDoc.onFileMgrCreated = function(fileMgrParameter) {
        fileMgr = fileMgrParameter;
    };

    var htmlWithComments, htmlWithoutComments;
    buttonAggDoc.onPreviewFinished = function(htmlWithCommentsParam, htmlWithoutCommentsParam) {
        htmlWithComments = htmlWithCommentsParam;
        htmlWithoutComments = htmlWithoutCommentsParam;
    };

    buttonAggDoc.onCreateButton = function() {
        return buttonAggDocHTML;
    };

    buttonAggDoc.onCreateMenuButton = function() {
        return $(buttonAggDocSettingsHTML)[0];
    };

    var selectedFileDesc;
    buttonAggDoc.onFileSelected = function(fileDesc) {
        selectedFileDesc = fileDesc;

        if (fileDesc.fileType == 'agg') {
            $('.action-button-docsave').show();
            $('.menu-panel-docsettings').show();
        } else {
            $('.action-button-docsave').hide();
            $('.menu-panel-docsettings').hide();
        }
    };

    buttonAggDoc.onReady = function() {
        $createDocAggName = $('#createDocAggName');
        $createDocAggDocTitle = $('#createDocAggDocTitle');
        $fileTitleNavbar = $(".file-title-navbar");
        $documentList = $('.document-list');
        $fileAggnameNavbar = $('.agg-name-navbar');

        $('.action-button-docsave').on('click', function() {
            _submitDoc(selectedFileDesc);
        });

        $('.form-control-bbox-otime').datepicker()
            .on('changeDate', function() {
                $(this).datepicker('hide');
            });

        // 更新导航栏聚合页连接
        $fileAggnameNavbar.text(_defaultDocInfo.aggName).attr({href:'/agg?name='+_defaultDocInfo.aggName+'&doc='+_defaultDocInfo.aggName+'/'+_defaultDocInfo.title});

        // 打开默认文档
        _openDefaultDoc();

        // 更新历史文档列表
        // 首先生成文档，然后再生成历史文档列表，所以延时400ms
        setTimeout(function(){
            $documentList.html(_getDocumentList());
        },400);
    };


    var changeStatus = false;
    buttonAggDoc.onContentChanged = function() {
        changeStatus = true;
    };

    window.onbeforeunload = function(evt){ 
        evt = evt || window.event;
        if(changeStatus){
            evt.returnValue = "亲！离开前别忘了保存文章哦！";
        }
    };

    return buttonAggDoc;

});