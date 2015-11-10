define([
    "jquery",
    "classes/Extension",
    "text!html/buttonViewer.html",
], function($, Extension, buttonViewerHTML) {

    var test = new Extension("test", 'testtesttesttest', true, true);
    test.settingsBlock = '<p>Adds a "Viewer" button over the preview.</p>';


    var eventMgr;
    test.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

	test.onCreateMenuButton = function() {
	    var button = $('<a data-toggle="modal" data-target=".modal-import-harddrive-markdown" class="list-group-item action-reset-input" href="#"><i class="icon-hdd"></i> Import from disk</a>');
	    button.click(function() {
	        eventMgr.onMessage('Booom!');
	    });
	    return button[0];
	};
    return test;

});