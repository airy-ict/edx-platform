define(
    ['underscore', 'gettext', 'js/views/baseview', 'edx-ui-toolkit/js/utils/html-utils',
        'edx-ui-toolkit/js/utils/string-utils', 'text!templates/video-transcripts.underscore'],
    function(_, gettext, BaseView, HtmlUtils, StringUtils, videoTranscriptsTemplate) {
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
                    clientTitle.replace(videoFormat, '');
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
                var errorMessage;

                // If an error is already present above the video transcript element, remove it.
                this.clearErrorMessage('');

                errorMessage = ''; // this.validateTranscriptFile(data.files[0]);
                if (!errorMessage) {
                    // Do not trigger global AJAX error handler
                    // data.global = false;    // eslint-disable-line no-param-reassign
                    // data.edx_video_id = 'edx-video-id';
                    // data.language_code = 'edx-video-id';
                    // data.formData = {edx_video_id: 'edx-video-id', language_code: 'en'};
                    this.readMessages([gettext('Video transcript upload started')]);
                    data.submit();
                } else {
                    this.showErrorMessage(errorMessage);
                }
            },

            transcriptUploadSucceeded: function(event, data) {
                // TODO: Update anu UI?
                //this.$('img').attr('src', data.result.image_url);
                this.readMessages([gettext('Video transcript upload completed')]);
            },

            transcriptUploadFailed: function(event, data) {
                var errorText = JSON.parse(data.jqXHR.responseText).error;
                this.showErrorMessage(errorText);
            },

            clearErrorMessage: function(transcriptLanguageCode) {
                // TODO: Clear error message.
                /*
                var $thumbnailWrapperEl = $('.thumbnail-error-wrapper[data-video-id="' + videoId + '"]');
                if ($thumbnailWrapperEl.length) {
                    $thumbnailWrapperEl.remove();
                }
                // Remove error class from thumbnail wrapper as well.
                $('.thumbnail-wrapper').removeClass('error');
                */
            },

            showErrorMessage: function(errorMessage) {
                // TODO: Show error message UI
                console.log(errorMessage);
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
