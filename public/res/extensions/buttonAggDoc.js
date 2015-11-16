define([
    "jquery",
    "storage",
    "classes/Extension",
    "text!html/buttonAggDocSave.html",
    "text!html/buttonAggDocSettings.html",
    "JSONEditor",
], function($, storage, Extension, buttonAggDocHTML, buttonAggDocSettingsHTML, JSONEditor) {
    var _updateDoc = function(data, callback) {
        callback = callback || function() {
            eventMgr.onMessage('更新文档成功！');
        };
        // extend doc Info
        if (window.Meilishuo && window.Meilishuo.constant && window.Meilishuo.constant.docInfo) {
            _.extend(data, window.Meilishuo.constant.docInfo);
        }
        $.post('/data/agg/docedit', data, function(res) {
            if (res.code == 0) {
                callback();
            }
        }, 'JSON')
    }
    var _getDoc = function(data, callback) {
        $.get('/data/agg/doc', data, function(res) {
            if (res.code == 0) {
                callback(res.info);
            } else {
                eventMgr.onError(res.message)
            }
        }, 'JSON')
    }


    var buttonAggDoc = new Extension("buttonAggDoc", 'Save Document', true, true);

    var $createDocAggName, $createDocAggDocTitle, $fileTitleNavbar, $modalDocnewAgginfo, aggList;

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
    /*    buttonAggDoc.onFileOpen = function(fileDesc){
            console.log(fileDesc)
        }*/

    buttonAggDoc.onFileCreated = function(fileDesc, opt) {
        if (fileDesc.fileType == 'agg') {
            // show agg ingo modal
            $modalDocnewAgginfo.modal();

            // set default aggname
            $.get('/data/agg/list', function(data) {
                var dataLen = data.length,
                    curOption = "";
                if (dataLen) {
                    aggList = data;

                    for (var item = 0; item < dataLen; item++) {
                        curOption += '<option value="' + data[item].name + '">' + data[item].title + '</option>'
                    }
                    $createDocAggName.html(curOption);
                    opt.currentFile.aggName && $createDocAggName.val(opt.currentFile.aggName);
                }
            }, 'JSON')
        }
    }

    buttonAggDoc.onReady = function() {
        $createDocAggName = $('#createDocAggName');
        $createDocAggDocTitle = $('#createDocAggDocTitle');
        $fileTitleNavbar = $(".file-title-navbar");
        $modalDocnewAgginfo = $('.modal-docnew-agginfo');

        $('.action-button-docsave').on('click', function() {
            var data = {
                //_id: _id,
                title: selectedFileDesc.title,
                //creator: creator,
                category: selectedFileDesc.aggName,
                mdContent: selectedFileDesc.content,
                htmlContent: htmlWithoutComments
            }
            _updateDoc(data);
        })

        $('.form-control-bbox-otime').datepicker()
            .on('changeDate', function() {
                $(this).datepicker('hide');
            });

        $('#createDocAggForm').on('submit', function(evt, data) {
            // set agg file name
            selectedFileDesc.aggName = $createDocAggName.val();
            // set doc title
            selectedFileDesc.title = $createDocAggDocTitle.val();
            eventMgr.onTitleChanged(selectedFileDesc);

            $modalDocnewAgginfo.modal('hide');
            return false;
        })

        $modalDocnewAgginfo.on('hidden.bs.modal', function() {
            if (selectedFileDesc.fileType == 'agg' && !selectedFileDesc.aggName) {
                fileMgr.deleteFile(selectedFileDesc);
            }
        })

        $modalDocnewAgginfo.on('shown.bs.modal', function() {
            $createDocAggDocTitle.focus();
        })

        $createDocAggName.on('change', function() {

        })

        //setInterval(function(){
        //console.log(storage[selectedFileDesc.fileIndex+'.content']);
        //},2000)
    }


    return buttonAggDoc;

});