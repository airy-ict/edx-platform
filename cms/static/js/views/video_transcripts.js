define(
    ['underscore', 'gettext', 'js/views/baseview', 'edx-ui-toolkit/js/utils/html-utils',
        'edx-ui-toolkit/js/utils/string-utils', 'text!templates/video-transcripts.underscore',
        'text!templates/video-transcript-response.underscore'],
    function(_, gettext, BaseView, HtmlUtils, StringUtils, videoTranscriptsTemplate, videoTranscriptResponseTemplate) {
        'use strict';

        var VideoTranscriptsView = BaseView.extend({
            tagName: 'div',

            events: {
                'click .toggle-show-transcripts-button': 'toggleShowTranscripts',
                'click .upload-transcript-button': 'chooseFile'
            },

            initialize: function(options) {
                this.transcripts = options.transcripts;
                this.edxVideoID = options.edxVideoID;
                this.clientVideoID = options.clientVideoID;
                this.transcriptAvailableLanguages = options.transcriptAvailableLanguages;
                this.videoSupportedFileFormats = options.videoSupportedFileFormats;
                this.videoTranscriptSettings = options.videoTranscriptSettings;
                this.template = HtmlUtils.template(videoTranscriptsTemplate);
                this.transcriptResponseTemplate = HtmlUtils.template(videoTranscriptResponseTemplate);

                // This is needed to attach transcript methods to this object while uploading.
                _.bindAll(
                    this, 'render', 'chooseFile', 'transcriptSelected', 'transcriptUploadSucceeded',
                    'transcriptUploadFailed'
                );
            },

            /*
            Sorts object by value and returns a sorted array.
            */
            sortByValue: function(itemObject) {
                var sortedArray = [];
                _.each(itemObject, function(value, key) {
                    // Push each JSON Object entry in array by [value, key]
                    sortedArray.push([value, key]);
                });
                return sortedArray.sort();
            },

            /*
            Returns transcript title.
            */
            getTranscriptClientTitle: function() {
                var clientTitle = this.clientVideoID;
                // Remove video file extension for transcript title.
                _.each(this.videoSupportedFileFormats, function(videoFormat) {
                    clientTitle = clientTitle.replace(videoFormat, '');
                });
                return clientTitle.substring(0, 20);
            },

            /*
            Toggles Show/Hide transcript button and transcripts container.
            */
            toggleShowTranscripts: function() {
                var $transcriptsWrapperEl = this.$el.find('.show-video-transcripts-wrapper');

                // Toggle show transcript wrapper.
                $transcriptsWrapperEl.toggleClass('hidden');

                // Toggle button text.
                HtmlUtils.setHtml(
                    this.$el.find('.toggle-show-transcripts-button-text'),
                    StringUtils.interpolate(
                        gettext('{toggleShowTranscriptText} transcripts ({totalTranscripts})'),
                        {
                            toggleShowTranscriptText: $transcriptsWrapperEl.hasClass('hidden') ? gettext('Show') : gettext('Hide'), // eslint-disable-line max-len
                            totalTranscripts: _.size(this.transcripts)
                        }
                    )
                );

                // Toggle icon class.
                if ($transcriptsWrapperEl.hasClass('hidden')) {
                    this.$el.find('.toggle-show-transcripts-icon').removeClass('fa-caret-down').addClass('fa-caret-right'); // eslint-disable-line max-len
                } else {
                    this.$el.find('.toggle-show-transcripts-icon').removeClass('fa-caret-right').addClass('fa-caret-down'); // eslint-disable-line max-len
                }
            },

            validateTranscriptFile: function(transcriptFile) {
                var errorMessage = '';
                // TODO: Validations if any ?
                return errorMessage;
            },

            chooseFile: function(event) {
                var $transcriptContainer = $(event.target).parents('.show-video-transcript-content'),
                    $transcriptUploadEl = $transcriptContainer.find('.upload-transcript-input');

                $transcriptUploadEl.fileupload({
                    url: this.videoTranscriptSettings.transcript_upload_handler_url,
                    add: this.transcriptSelected,
                    done: this.transcriptUploadSucceeded,
                    fail: this.transcriptUploadFailed,
                    formData: {
                        edx_video_id: this.edxVideoID,
                        language_code: $transcriptContainer.data('language-code'),
                        new_language_code: $transcriptContainer.find('.transcript-language-menu').val(),
                        gloabl: false   // Do not trigger global AJAX error handler
                    }
                });

                $transcriptUploadEl.click();
            },

            transcriptSelected: function(event, data) {
                var errorMessage,
                    $transcriptContainer = $(event.target).parents('.show-video-transcript-content');

                errorMessage = ''; // this.validateTranscriptFile(data.files[0]);
                if (!errorMessage) {
                    data.submit();
                    this.renderMessage($transcriptContainer, 'uploading');
                } else {
                    this.renderMessage($transcriptContainer, 'failed', errorMessage);
                }
            },

            transcriptUploadSucceeded: function(event, data) {
                var languageCode = data.formData.language_code,
                    newLanguageCode = data.formData.new_language_code,
                    $transcriptContainer = this.$el.find('.show-video-transcript-content[data-language-code="' + languageCode + '"]');  // eslint-disable-line max-len

                $transcriptContainer.data('language-code', newLanguageCode);
                HtmlUtils.setHtml(
                    $transcriptContainer.find('.transcript-title'),
                    StringUtils.interpolate(gettext('{transcriptClientTitle}_{transcriptLanguageCode}.{fileExtension}'),
                        {
                            transcriptClientTitle: this.getTranscriptClientTitle(),
                            transcriptLanguageCode: newLanguageCode,
                            fileExtension: this.videoTranscriptSettings.trancript_download_file_format
                        }
                    )
                );

                this.renderMessage($transcriptContainer, 'uploaded');
            },

            transcriptUploadFailed: function(event, data) {
                var languageCode = data.formData.language_code,
                    $transcriptContainer = this.$el.find('.show-video-transcript-content[data-language-code="' + languageCode + '"]'),  // eslint-disable-line max-len
                    errorMessage = JSON.parse(data.jqXHR.responseText).error;

                // Reset transcript language back to original.
                $transcriptContainer.find('.transcript-language-menu').val(languageCode);

                this.renderMessage($transcriptContainer, 'failed', errorMessage);
            },

            clearMessage: function($transcriptContainer) {
                HtmlUtils.setHtml(
                    $transcriptContainer.find('.transcript-response-message-container'),
                    ''
                );
            },

            renderMessage: function($transcriptContainer, status, errorMessage) {
                var responseIconClasses,
                    responseMessage,
                    responseSRMessage,
                    showErrorInfoIcon = 'hidden';

                // If a messge is already present above the video transcript element, remove it.
                this.clearMessage($transcriptContainer);

                switch (status) {
                case 'uploaded':
                    responseIconClasses = 'fa-check';
                    responseMessage = 'Transcript uploaded.';
                    responseSRMessage = 'Video transcript upload completed';
                    showErrorInfoIcon = 'hidden';
                    break;
                case 'failed':
                    responseIconClasses = 'fa-exclamation-triangle';
                    responseMessage = errorMessage || 'Transcript upload failed.';
                    responseSRMessage = 'Video transcript upload failed';
                    showErrorInfoIcon = '';
                    break;
                case 'uploading':
                    responseIconClasses = 'fa-spinner fa-pulse';
                    responseMessage = 'Uploading transcript';
                    responseSRMessage = 'Video transcript upload started';
                    showErrorInfoIcon = 'hidden';
                    break;
                default:
                    break;
                }

                HtmlUtils.setHtml(
                    $transcriptContainer.find('.transcript-response-message-container'),
                    this.transcriptResponseTemplate({
                        responseIconClasses: responseIconClasses,
                        responseMessage: gettext(responseMessage),
                        showErrorInfoIcon: showErrorInfoIcon
                    })
                );
                this.readMessages([gettext(responseSRMessage)]);
            },

            readMessages: function(messages) {
                if ($(window).prop('SR') !== undefined) {
                    $(window).prop('SR').readTexts(messages);
                }
            },

            /*
            Renders transcripts view.
            */
            render: function() {
                HtmlUtils.setHtml(
                    this.$el,
                    this.template({
                        transcripts: this.transcripts,
                        transcriptAvailableLanguages: this.sortByValue(this.transcriptAvailableLanguages),
                        edxVideoID: this.edxVideoID,
                        transcriptClientTitle: this.getTranscriptClientTitle(),
                        transcriptDownloadFileFormat: this.videoTranscriptSettings.trancript_download_file_format,
                        transcriptDownloadHandlerUrl: this.videoTranscriptSettings.transcript_download_handler_url
                    })
                );
                return this;
            }
        });

        return VideoTranscriptsView;
    }
);
