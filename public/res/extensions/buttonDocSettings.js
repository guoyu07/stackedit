define([
    "jquery",
    "underscore",
    "utils",
    "classes/Extension",
    "text!html/buttonDocSettings.html",
], function($, _, utils, Extension, buttonDocSettingsHTML) {

    var buttonDocSettings = new Extension("buttonDocSettings", 'Doc settings ', true);
    buttonDocSettings.defaultConfig = {
        template: "<%= documentHTML %>"
    };

    buttonDocSettings.onLoadSettings = function() {
        utils.setInputValue("#textarea-html-code-template", buttonDocSettings.config.template);
    };

    buttonDocSettings.onSaveSettings = function(newConfig) {
        newConfig.template = utils.getInputValue("#textarea-html-code-template");
    };

    var eventMgr;
    buttonDocSettings.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    buttonDocSettings.onCreateMenuButton = function() {
        return $(buttonDocSettingsHTML)[0];
    };

    var selectedFileDesc;
    buttonDocSettings.onFileSelected = function(fileDesc) {
        selectedFileDesc = fileDesc;
    };

    var htmlWithComments, htmlWithoutComments;
    buttonDocSettings.onPreviewFinished = function(htmlWithCommentsParam, htmlWithoutCommentsParam) {
        htmlWithComments = htmlWithCommentsParam;
        htmlWithoutComments = htmlWithoutCommentsParam;
    };

    buttonDocSettings.onReady = function() {
        $('.form-control-bbox-otime').datepicker()
            .on('changeDate',function(){
                $(this).datepicker('hide');
            });
    };

    return buttonDocSettings;

});
