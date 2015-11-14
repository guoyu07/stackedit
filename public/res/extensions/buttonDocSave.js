define([
    "jquery",
    "storage",
    "classes/Extension",
    "text!html/buttonDocSave.html",
], function($, storage, Extension, buttonDocSaveHTML) {

    var buttonDocSave = new Extension("buttonDocSave", 'Save Document', true, true);


    var eventMgr;
    buttonDocSave.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    buttonDocSave.onCreateButton = function() {
        return buttonDocSaveHTML;
    };

    var selectedFileDesc;
    buttonDocSave.onFileSelected = function(fileDesc) {
        selectedFileDesc = fileDesc;
        console.log(selectedFileDesc);
    };

    buttonDocSave.onFileCreated = function(fileDesc){
        if(fileDesc.fileType == 'agg'){
            $('.modal-docnew-agginfo').modal();
        }
    }

    buttonDocSave.onReady = function(){
    	$('.action-button-docsave').on('click',function(){
    		eventMgr.onError('Booom!');
    	})
        //setInterval(function(){
            //console.log(storage[selectedFileDesc.fileIndex+'.content']);
        //},2000)
    }


    return buttonDocSave;

});