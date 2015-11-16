define([
    "jquery",
    "storage",
    "classes/Extension",
    "text!html/buttonAggDocSave.html",
    "text!html/buttonAggDocSettings.html",
    "JSONEditor",
], function($, storage, Extension, buttonAggDocHTML, buttonAggDocSettingsHTML, JSONEditor) {

    var buttonAggDoc = new Extension("buttonAggDoc", 'Save Document', true, true);


    var eventMgr;
    buttonAggDoc.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
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
        console.log(selectedFileDesc);
        console.log(JSONEditor);
        if(fileDesc.fileType == 'agg'){
            $('.action-button-docsave').show();
            $('.menu-panel-docsettings').show();
        }else{
            $('.action-button-docsave').hide();
            $('.menu-panel-docsettings').hide();
        }
    };

    buttonAggDoc.onFileCreated = function(fileDesc){
        if(fileDesc.fileType == 'agg'){
            $('.modal-docnew-agginfo').modal();   
        }
    }

    buttonAggDoc.onReady = function(){
    	$('.action-button-docsave').on('click',function(){
    		eventMgr.onError('Booom!');
    	})


        $('.form-control-bbox-otime').datepicker()
            .on('changeDate',function(){
                $(this).datepicker('hide');
            });
        //setInterval(function(){
            //console.log(storage[selectedFileDesc.fileIndex+'.content']);
        //},2000)
    }


    return buttonAggDoc;

});