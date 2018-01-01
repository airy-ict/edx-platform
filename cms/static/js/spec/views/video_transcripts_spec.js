define(
    ['jquery', 'underscore', 'backbone', 'js/views/video_transcripts', 'js/views/previous_video_upload_list',
        'edx-ui-toolkit/js/utils/spec-helpers/ajax-helpers', 'common/js/spec_helpers/template_helpers'],
    function($, _, Backbone, VideoTranscriptsView, PreviousVideoUploadListView, AjaxHelpers, TemplateHelpers) {
        'use strict';
        describe('VideoTranscriptsView', function() {
            var videoTranscriptsView,
                renderView,
                verifyTranscriptActions,
                createFakeTranscriptFile,
                transcripts = {
                    en: 'English',
                    es: 'Spanish',
                    ur: 'Urdu'
                },
                edxVideoID = 'test-edx-video-id',
                clientVideoID = 'Video client title name.mp4',
                transcriptAvailableLanguages = {
                    en: 'English',
                    es: 'Spanish',
                    cn: 'Chinese',
                    ar: 'Arabic',
                    ur: 'Urdu'
                },
                TRANSCRIPT_DOWNLOAD_FILE_FORMAT = 'srt',
                TRANSCRIPT_DOWNLOAD_URL = 'abc.com/transcript_download/course_id',
                TRANSCRIPT_UPLOAD_URL = 'abc.com/transcript_upload/course_id',
                videoSupportedFileFormats = ['.mov', '.mp4'],
                videoTranscriptSettings = {
                    trancript_download_file_format: TRANSCRIPT_DOWNLOAD_FILE_FORMAT,
                    transcript_download_handler_url: TRANSCRIPT_DOWNLOAD_URL,
                    transcript_upload_handler_url: TRANSCRIPT_UPLOAD_URL
                },
                videoListView;

            verifyTranscriptActions = function($transcriptActionsEl, transcriptLanguage) {
                var downloadTranscriptActionEl = $transcriptActionsEl.find('.download-transcript-button'),
                    uploadTranscriptActionEl = $transcriptActionsEl.find('.upload-transcript-button');

                expect(downloadTranscriptActionEl.html().trim(), 'Download');
                expect(
                    downloadTranscriptActionEl.attr('href'),
                    TRANSCRIPT_DOWNLOAD_URL + '?edx_video_id=' + edxVideoID + '&language_code=' + transcriptLanguage
                );

                expect(uploadTranscriptActionEl.html().trim(), 'Upload');
            };

            createFakeTranscriptFile = function() {
                var size = 100,
                    type = 'application/srt';    // eslint-disable-line no-redeclare
                return new Blob([Array(size + 1).join('i')], {type: type});
            };

            renderView = function(availableTranscripts, isVideoTranscriptEnabled) {
                var videoViewIndex = 0,
                    isVideoTranscriptEnabled = isVideoTranscriptEnabled || _.isUndefined(isVideoTranscriptEnabled), // eslint-disable-line max-len, no-redeclare
                    videoData = {
                        client_video_id: clientVideoID,
                        edx_video_id: edxVideoID,
                        created: '2014-11-25T23:13:05',
                        transcripts: availableTranscripts
                    },
                    videoCollection = new Backbone.Collection([new Backbone.Model(videoData)]);

                videoListView = new PreviousVideoUploadListView({
                    collection: videoCollection,
                    videoImageSettings: {},
                    videoTranscriptSettings: videoTranscriptSettings,
                    transcriptAvailableLanguages: transcriptAvailableLanguages,
                    videoSupportedFileFormats: videoSupportedFileFormats,
                    isVideoTranscriptEnabled: isVideoTranscriptEnabled
                });
                videoListView.setElement($('.wrapper-assets'));
                videoListView.render();

                videoTranscriptsView = videoListView.itemViews[videoViewIndex].videoTranscriptsView;
            };

            beforeEach(function() {
                setFixtures('<section class="wrapper-assets"></section>');
                TemplateHelpers.installTemplate('previous-video-upload-list');
                renderView(transcripts);
            });

            it('renders as expected', function() {
                // Verify transcript container is present.
                expect(videoListView.$el.find('.show-video-transcripts-container')).toExist();
                // Veirfy transcript column header is present.
                expect(videoListView.$el.find('.js-table-head .video-head-col.transcripts-col')).toExist();
                // Verify transcript data column is present.
                expect(videoListView.$el.find('.js-table-body .transcripts-col')).toExist();
                // Verify view has initiallized.
                expect(_.isUndefined(videoTranscriptsView)).toEqual(false);
            });

            it('does not render transcripts view if feature is disabled', function() {
                renderView(transcripts, false);
                // Verify transcript container is not present.
                expect(videoListView.$el.find('.show-video-transcripts-container')).not.toExist();
                // Veirfy transcript column header is not present.
                expect(videoListView.$el.find('.js-table-head .video-head-col.transcripts-col')).not.toExist();
                // Verify transcript data column is not present.
                expect(videoListView.$el.find('.js-table-body .transcripts-col')).not.toExist();
                // Verify view has not initiallized.
                expect(_.isUndefined(videoTranscriptsView)).toEqual(true);
            });

            it('does not show list of transcripts initially', function() {
                expect(
                    videoTranscriptsView.$el.find('.show-video-transcripts-wrapper').hasClass('hidden')
                ).toEqual(true);
                expect(videoTranscriptsView.$el.find('.toggle-show-transcripts-button-text').html().trim()).toEqual(
                    'Show transcripts (' + _.size(transcripts) + ')'
                );
            });

            it('shows list of transcripts when clicked on show transcript button', function() {
                // Verify transcript container is hidden
                expect(
                    videoTranscriptsView.$el.find('.show-video-transcripts-wrapper').hasClass('hidden')
                ).toEqual(true);

                // Verify initial button text
                expect(videoTranscriptsView.$el.find('.toggle-show-transcripts-button-text').html().trim()).toEqual(
                    'Show transcripts (' + _.size(transcripts) + ')'
                );
                videoTranscriptsView.$el.find('.toggle-show-transcripts-button').click();

                // Verify transcript container is not hidden
                expect(
                    videoTranscriptsView.$el.find('.show-video-transcripts-wrapper').hasClass('hidden')
                ).toEqual(false);

                // Verify button text is changed.
                expect(videoTranscriptsView.$el.find('.toggle-show-transcripts-button-text').html().trim()).toEqual(
                    'Hide transcripts (' + _.size(transcripts) + ')'
                );
            });

            it('hides list of transcripts when clicked on hide transcripts button', function() {
                // Click to show transcripts first.
                videoTranscriptsView.$el.find('.toggle-show-transcripts-button').click();

                // Verify button text.
                expect(videoTranscriptsView.$el.find('.toggle-show-transcripts-button-text').html().trim()).toEqual(
                    'Hide transcripts (' + _.size(transcripts) + ')'
                );

                // Verify transcript container is not hidden
                expect(
                    videoTranscriptsView.$el.find('.show-video-transcripts-wrapper').hasClass('hidden')
                ).toEqual(false);

                videoTranscriptsView.$el.find('.toggle-show-transcripts-button').click();

                // Verify button text is changed.
                expect(videoTranscriptsView.$el.find('.toggle-show-transcripts-button-text').html().trim()).toEqual(
                    'Show transcripts (' + _.size(transcripts) + ')'
                );

                // Verify transcript container is hidden
                expect(
                    videoTranscriptsView.$el.find('.show-video-transcripts-wrapper').hasClass('hidden')
                ).toEqual(true);
            });

            it('renders appropriate text when no transcript is available', function() {
                // Render view with no transcripts
                renderView({});

                // Verify appropriate text is shown
                expect(
                    videoTranscriptsView.$el.find('.transcripts-empty-text').html()
                ).toEqual('No transcript available yet.');
            });

            it('renders correct transcript attributes', function() {
                var $transcriptEl;
                // Show transcripts
                videoTranscriptsView.$el.find('.toggle-show-transcripts-button').click();
                expect(videoTranscriptsView.$el.find('.show-video-transcript-content').length).toEqual(
                    _.size(transcripts)
                );

                _.each(transcripts, function(langaugeText, languageCode) {
                    $transcriptEl = videoTranscriptsView.$el.find('.show-video-transcript-content[data-language-code="' + languageCode + '"]');  // eslint-disable-line max-len
                    // Verify correct transcript title is set.
                    expect($transcriptEl.find('.transcript-title').html()).toEqual(
                        'Video client title n_' + languageCode + '.' + TRANSCRIPT_DOWNLOAD_FILE_FORMAT
                    );
                    // Verify transcript language dropdown has correct value set.
                    expect($transcriptEl.find('.transcript-language-menu').val(), languageCode);

                    // Verify transcript actions are rendered correctly.
                    verifyTranscriptActions($transcriptEl.find('.transcript-actions'), languageCode);
                });
            });

            it('can upload transcript', function() {
                var languageCode = 'en',
                    newLanguageCode = 'ur',
                    requests = AjaxHelpers.requests(this),
                    $transcriptEl = videoTranscriptsView.$el.find('.show-video-transcript-content[data-language-code="' + languageCode + '"]');

                    // Verify correct transcript title is set.
                expect($transcriptEl.find('.transcript-title').html()).toEqual(
                    'Video client title n_' + languageCode + '.' + TRANSCRIPT_DOWNLOAD_FILE_FORMAT
                );

                // Select a language
                $transcriptEl.find('.transcript-language-menu').val(newLanguageCode);

                $transcriptEl.find('.upload-transcript-button').click();

                // Add transcript to upload queue and send POST request to upload transcript.
                $transcriptEl.find('.upload-transcript-input').fileupload('add', {files: [createFakeTranscriptFile()]});

                // Verify if POST request received for image upload
                AjaxHelpers.expectRequest(
                    requests,
                    'POST',
                    TRANSCRIPT_UPLOAD_URL
                );

                // Send successful upload response
                AjaxHelpers.respondWithJson(requests, {transcript_url: TRANSCRIPT_UPLOAD_URL});

                // Verify correct transcript title is set.
                expect($transcriptEl.find('.transcript-title').html()).toEqual(
                    'Video client title n_' + newLanguageCode + '.' + TRANSCRIPT_DOWNLOAD_FILE_FORMAT
                );

            });
        });
    }
);
