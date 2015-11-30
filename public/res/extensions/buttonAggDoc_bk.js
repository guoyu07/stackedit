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
    var $createDocAggName, $createDocAggDocTitle, $fileTitleNavbar, $modalDocnewAgginfo;

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

    var _submitDoc = function(fileDesc, callback) {
        callback = callback || function(res) {
            console.log('>>>更新文档结果', res);
            eventMgr.onMessage('更新文档成功！');
        };

        // 生成基本数据
        var postData = {
            _id         : _defaultDocInfo._id || '',
            title       : _defaultDocInfo.title,
            category    : _defaultDocInfo.aggName,
            creator     : _defaultDocInfo.creator,

            mdContent   : fileDesc.content, // 文档markdown格式内容
            htmlContent : htmlWithoutComments // 文档html格式内容
        };

        var postUrl = '/aj/agg/newdoc';
        if (postData._id) {
            postUrl = '/aj/agg/editdoc';
        }

        $.post(postUrl, postData, function(res) {
            if (res.code === 0) {
                callback(res);
            }
        }, 'JSON');
    };

    /*
     * 通过aggName,title获取文档
     */
    var _getDoc = function(fileDesc, callback) {
        // 如果不存在aggName,title，就没有必要再去数据库中取最新文档了
        if (!fileDesc.aggName || !fileDesc.title) {
            return;
        }

        console.log('>>>通过aggName , title获取文档:', fileDesc);
        callback = callback || function(res) {
            _defaultDocInfo = _formatDoc(res);
            fileDesc.content = _defaultDocInfo.content;
            eventMgr.onContentChanged(fileDesc);
        };

        $.get('/aj/agg/getdoc', {
            doc: fileDesc.aggName + '/' + fileDesc.title
        }, function(res) {
            console.log('>>>通过aggName , title获取文档成功:', res);
            callback(res);
        }, 'JSON');
    };

    /*
     * 通过默认数据打开文档
     */
    var _openDefaultDoc = function() {
        // 如果不存在默认文件就不用打开了，直接执行stackedit的默认操作
        if (!_defaultDocInfo) {
            return;
        }

        console.log('>>>通过默认数据打开本地文档:', _defaultDocInfo);
        var curFileDesc;
        // 过滤缓存文件，如果文档中有_id和默认文件一样的，就直接打开
        var aggDocList = _.filter(fileSystem, function(fileDesc) {
            // 缓存文件和默认文件的aggName、title、_id完全一致
            if (fileDesc.aggName == _defaultDocInfo.aggName && fileDesc.title == _defaultDocInfo.title) {
                return true;
            }
        });
        // 通过_defaultDocInfo创建文档
        var _createFile = function() {
            setTimeout(function() {

                // 创建文件
                curFileDesc = fileMgr.createFile({
                    fileType: 'agg',
                    title: _defaultDocInfo.title,
                    _id: _defaultDocInfo._id,
                    aggName: _defaultDocInfo.aggName,
                    content: _defaultDocInfo.mdContent
                });

                fileMgr.selectFile(curFileDesc);
            }, 400);
        };

        if (aggDocList.length === 1) {
            console.log('>>>有匹配到的缓存文档，直接选中文档:', _defaultDocInfo);

            // 如果只有一个匹配的文档 ， 则打开该文档
            fileMgr.selectFile(aggDocList[0]);
        } else if (aggDocList.length === 0) {
            console.log('>>>没有匹配到的缓存文档，通过默认数据创建文档:', _defaultDocInfo);

            // 如果没有一个匹配的文档 ， 则创建文档
            _createFile();
        } else {
            eventMgr.onError('aggName为' + _defaultDocInfo.aggName + '，且docTitle为' + _defaultDocInfo.title + '的文档有' + aggDocList.length + '个，请删除后再试');
        }
    };

    /*
     *  当文档被创建时执行以下操作：
     *    1.如果是AGG文件，则弹出modal让用户选择aggName, 填写文档title
     *    2.发get请求获取AGG列表
     */
    var _onCreatedDoc = function(fileDesc, opt) {
        // 如果已经有了aggName就不用创建了modal让用户选择AGG了
        if (opt.aggName) {
            return;
        }

        var _createAgglist = function(data) {
            var dataLen = data.length,
                curOption = "";
            if (dataLen < 1) {
                return;
            }

            // 生成select选择按钮
            for (var item = 0; item < dataLen; item++) {
                curOption += '<option value="' + data[item].name + '">' + data[item].title + '</option>';
            }
            $createDocAggName.html(curOption);

            // 默认选中上一个文件的aggName
            opt.currentFile && opt.currentFile.aggName && $createDocAggName.val(opt.currentFile.aggName);

        };

        if (fileDesc.fileType == 'agg') {
            // show agg info modal
            $modalDocnewAgginfo.modal();

            // set default aggname
            $.get('/aj/agg/list', function(data) {
                _createAgglist(data);
            }, 'JSON');
        }

    };

    if (window.Meilishuo && window.Meilishuo.constant && window.Meilishuo.constant) {
        _defaultDocInfo = _formatDoc(window.Meilishuo.constant.docInfo);
        _defaultUserInfo = window.Meilishuo.constant.userInfo;
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

        _getDoc(fileDesc);
    };

    buttonAggDoc.onFileCreated = function(fileDesc, opt) {
        _onCreatedDoc(fileDesc, opt);
    };

    buttonAggDoc.onReady = function() {
        $createDocAggName = $('#createDocAggName');
        $createDocAggDocTitle = $('#createDocAggDocTitle');
        $fileTitleNavbar = $(".file-title-navbar");
        $modalDocnewAgginfo = $('.modal-docnew-agginfo');

        $('.action-button-docsave').on('click', function() {
            _submitDoc(selectedFileDesc);
        });

        $('.form-control-bbox-otime').datepicker()
            .on('changeDate', function() {
                $(this).datepicker('hide');
            });

        $('#createDocAggForm').on('submit', function() {
            // 设置文档所属聚合页
            selectedFileDesc.aggName = $createDocAggName.val();
            // 设置文档名称
            selectedFileDesc.title = $createDocAggDocTitle.val();
            eventMgr.onTitleChanged(selectedFileDesc);
            // 隐藏modal
            $modalDocnewAgginfo.modal('hide');
            // 获取最新文档
            _getDoc(selectedFileDesc , function(res){
                if(_defaultDocInfo.content){/*
                    selectedFileDesc.content = _defaultDocInfo.content;
                    eventMgr.onContentChanged(selectedFileDesc);*/
                    window.location.href = '/agg/doc?name='+_defaultDocInfo.aggName+'&doc='+_defaultDocInfo.aggName+'/'+_defaultDocInfo.title;
                }else{
                    _defaultDocInfo = _formatDoc(res);
                }
            });
            return false;
        });

        $modalDocnewAgginfo.on('hidden.bs.modal', function() {
            if (selectedFileDesc.fileType == 'agg' && !selectedFileDesc.aggName) {
                fileMgr.deleteFile(selectedFileDesc);
            }
        });

        $modalDocnewAgginfo.on('shown.bs.modal', function() {
            $createDocAggDocTitle.focus();
        });

        $createDocAggName.on('change', function() {

        });

        // 打开默认文档
        _openDefaultDoc();
    };


    return buttonAggDoc;

});