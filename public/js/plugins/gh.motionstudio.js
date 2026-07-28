gh.motionstudio = function(options) {
    this.initialize(options || {});
};

gh.motionstudio.prototype = {
    initialize: function(options) {
        var me = this;

        this.graphics = options.graphics;
        this.getContentScale =
            options.getContentScale || function() { return 1; };
        this.getCard = options.getCard || function() { return null; };
        this.getCards = options.getCards || function() { return []; };
        this.closeContextMenu = options.closeContextMenu || function() {};
        this.storageKey = 'purett.motionStudio.v2';
        this.sessionVersion = 2;
        this.opened = false;
        this.surface = null;
        this.api = null;
        this.preset = null;
        this.playbook = null;
        this.coinTargetId = 'match-turn-coin-transition';
        this.coinPreviewDirection = 'player-to-opponent';
        this.coinPreset = null;
        this.activeTargetId = 'lobby-card-1-intro';
        this.activeTarget = null;
        this.entryDelayMs = 0;
        this.previewingLobby = false;
        this.previewGeneration = 0;
        this.pendingPreviewToken = null;
        this.activePresetName = 'casual-toss';
        this.basePresetName = 'casual-toss';
        this.targetPresetNames = {};
        this.replayTimer = null;
        this.lastTrigger = null;
        this.lastSurfaceState = null;
        this.lastHelperPlanRevision = null;
        this.previewCardKey = null;
        this.previewPlan = null;
        this.controlsBuilt = false;
        this.helperDrag = null;
        this.contentScale = 1;
        this.reducedMotion = this.prefersReducedMotion();
        this.controlDefinitions = [
            {group: 'sequence', field: 'entry.delayMs', label: 'Start delay', min: 0, max: 1500, step: 5, unit: 'ms'},
            {group: 'path', field: 'path.directionDeg', label: 'Travel heading', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'path', field: 'path.distancePx', label: 'Travel distance', min: 0, max: 1000, step: 1, unit: 'px'},
            {group: 'path', field: 'path.curvePx', label: 'Path curve', min: -300, max: 300, step: 1, unit: 'px'},
            {group: 'path', field: 'path.flightMs', label: 'Flight time', min: 200, max: 2500, step: 10, unit: 'ms'},

            {group: 'height', field: 'path.releaseHeight', label: 'Release height', min: 0, max: 300, step: 1, unit: 'z'},
            {group: 'height', field: 'path.apexHeight', label: 'Apex height', min: 0, max: 400, step: 1, unit: 'z'},

            {group: 'keyframed-scale', field: 'scale.start', label: 'Release scale', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},
            {group: 'keyframed-scale', field: 'scale.apex', label: 'Apex scale', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},
            {group: 'keyframed-scale', field: 'scale.contact', label: 'Contact scale', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},

            {group: 'rotation', field: 'rotation.xTurns', label: 'End-over-end', min: -3, max: 3, step: 0.01, unit: 'turn'},
            {group: 'rotation', field: 'rotation.yTurns', label: 'Side-over-side', min: -3, max: 3, step: 0.01, unit: 'turn'},
            {group: 'rotation', field: 'rotation.zTurns', label: 'Table spin', min: -2, max: 2, step: 0.01, unit: 'turn'},
            {group: 'rotation', field: 'rotation.releasePitchDeg', label: 'Release pitch', min: -75, max: 75, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.releaseYawDeg', label: 'Release yaw', min: -75, max: 75, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.releaseRollDeg', label: 'Release roll', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.contactPitchDeg', label: 'Contact pitch', min: -45, max: 45, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.contactYawDeg', label: 'Contact yaw', min: -45, max: 45, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.contactRollDeg', label: 'Contact roll', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.finalRollDeg', label: 'Final rotation', min: -30, max: 30, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.flipTurns', label: 'Coin flips', min: -8, max: 8, step: 0.125, unit: 'turn'},
            {group: 'rotation', field: 'rotation.tumbleTurns', label: 'Coin tumble', min: -8, max: 8, step: 0.125, unit: 'turn'},
            {group: 'rotation', field: 'rotation.spinTurns', label: 'Table spin', min: -4, max: 4, step: 0.125, unit: 'turn'},
            {group: 'rotation', field: 'rotation.contactTiltDeg', label: 'Landing tilt', min: -45, max: 45, step: 1, unit: '\u00b0'},

            {group: 'landing', field: 'landing.skidDistancePx', label: 'Skid distance', min: 0, max: 200, step: 1, unit: 'px'},
            {group: 'landing', field: 'landing.skidAngleDeg', label: 'Skid direction', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'landing', field: 'landing.slapMs', label: 'Slap time', min: 0, max: 400, step: 5, unit: 'ms'},
            {group: 'landing', field: 'landing.skidMs', label: 'Skid time', min: 0, max: 1000, step: 5, unit: 'ms'},
            {group: 'landing', field: 'landing.settleMs', label: 'Settle time', min: 0, max: 600, step: 5, unit: 'ms'},
            {group: 'landing', field: 'shadow.strength', label: 'Shadow strength', min: 0, max: 1, step: 0.01, unit: ''},
            {group: 'landing', field: 'shadow.spread', label: 'Shadow spread', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'}
        ];

        $('#motionstudio').appendTo(document.body);
        this.setContentScale(this.getContentScale());
        this.buildControls();
        this.bindUi();
        $(window).on('resize.motionstudio', function() {
            me.syncContentScaleLayout();
        });

        $('#contextmenu li.motion-studio > button').click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (!$(this).closest('li').hasClass('enabled')) {
                return;
            }
            gh.audio.select.play();
            me.lastTrigger = this;
            me.closeContextMenu();
            me.open();
        });
    },

    buildControls: function() {
        var me = this;
        if (this.controlsBuilt) {
            return;
        }
        this.controlsBuilt = true;

        $.each(this.controlDefinitions, function(index, definition) {
            var id = 'motionstudio-field-' + definition.field.replace(/\./g, '-');
            var $row = $('<div class="motion-studio-control"></div>');
            var coinOnly = $.inArray(
                definition.field,
                [
                    'rotation.flipTurns',
                    'rotation.tumbleTurns',
                    'rotation.spinTurns',
                    'rotation.contactTiltDeg',
                    'landing.settleMs'
                ]
            ) !== -1;
            var shared = $.inArray(
                definition.field,
                [
                    'path.curvePx',
                    'path.flightMs',
                    'path.apexHeight',
                    'shadow.strength',
                    'shadow.spread'
                ]
            ) !== -1;
            var $label = $('<label></label>')
                .attr('for', id + '-range')
                .attr('title', definition.label)
                .text(definition.label);
            var $range = $('<input type="range">')
                .attr({
                    id: id + '-range',
                    min: definition.min,
                    max: definition.max,
                    step: definition.step,
                    'data-motion-field': definition.field,
                    'data-motion-control': 'range'
                });
            var $number = $('<input type="number">')
                .attr({
                    id: id + '-number',
                    min: definition.min,
                    max: definition.max,
                    step: definition.step,
                    'data-motion-field': definition.field,
                    'data-motion-control': 'number',
                    'aria-label': definition.label + ' value'
                });
            var $unit = $('<span class="motion-studio-unit"></span>')
                .text(definition.unit);
            $row
                .attr(
                    'data-motion-subject',
                    coinOnly
                        ? 'coin'
                        : (shared ? 'shared' : 'card')
                )
                .append($label, $range, $number, $unit);
            $('[data-motion-control-group="' + definition.group + '"]')
                .append($row);
        });
    },

    setContentScale: function(scale) {
        scale = parseFloat(scale);
        if (!isFinite(scale) || scale <= 0) {
            scale = 1;
        }
        this.contentScale = scale;
        this.syncContentScaleLayout();
    },

    syncContentScaleLayout: function() {
        var scale = this.contentScale || 1;
        var shell =
            document.querySelector(
                '#motionstudio .motion-studio-shell'
            );
        var stacked =
            window.matchMedia &&
            window.matchMedia('(max-width: 1190px)').matches;
        var logicalWidth =
            shell && shell.offsetWidth
                ? shell.offsetWidth
                : (stacked ? 755 : 1177);
        var logicalHeight =
            shell && shell.offsetHeight
                ? shell.offsetHeight
                : (stacked ? 1136 : 562);

        $('#motionstudio')
            .attr('data-content-scale', String(scale));
        $('#motionstudio .motion-studio-shell')
            .css('transform', 'scale(' + scale + ')');
        $('#motionstudio .motion-studio-scale-stage').css({
            width: (logicalWidth * scale) + 'px',
            height: (logicalHeight * scale) + 'px',
            marginTop: (18 * scale) + 'px',
            marginBottom: (18 * scale) + 'px'
        });
    },

    bindUi: function() {
        var me = this;

        $('#motionstudio .motion-studio-back').click(function() {
            me.close();
        });
        $('#motionstudio .motion-studio-reset').click(function() {
            me.resetActiveTarget();
        });
        $('#motionstudio-target').change(function() {
            me.selectTarget($(this).val(), true);
        });
        $('#motionstudio-coin-direction').change(function() {
            me.coinPreviewDirection = $(this).val() ===
                'opponent-to-player'
                ? 'opponent-to-player'
                : 'player-to-opponent';
            me.applyPresetToSurface(true);
        });
        $('#motionstudio-preset').change(function() {
            var name = $(this).val();
            if (name !== 'custom') {
                me.selectPreset(name);
            }
        });
        $('#motionstudio-controls').on(
            'input change',
            '[data-motion-field]',
            function(event) {
                me.onControlChange(this, event.type);
            }
        );
        $('#motionstudio-controls').on('submit', function(event) {
            event.preventDefault();
        });
        $('#motionstudio-show-helpers').change(function() {
            $('#motionstudio-preview').toggleClass(
                'helpers-hidden',
                !this.checked
            );
            me.saveSessionPreset();
        });
        $('#motionstudio-auto-replay').change(function() {
            me.saveSessionPreset();
        });
        $('#motionstudio-copy-target').change(function() {
            $('#motionstudio .motion-studio-copy-intro')
                .prop('disabled', !$(this).val());
        });
        $('#motionstudio .motion-studio-copy-intro').click(function() {
            me.copyIntroSharedMotion();
        });
        $('#motionstudio-preview').on(
            'pointerdown',
            '.motion-studio-marker-start',
            function(event) {
                me.beginHelperDrag('start', event);
            }
        );
        $(document).on('pointermove.motionstudio', function(event) {
            me.moveHelperDrag(event);
        });
        $(document).on(
            'pointerup.motionstudio pointercancel.motionstudio',
            function() {
                me.endHelperDrag();
            }
        );
        $('#motionstudio .motion-studio-replay').click(function() {
            me.replay();
        });
        $('#motionstudio .motion-studio-play').click(function() {
            me.togglePlayback();
        });
        $('#motionstudio .motion-studio-step-back').click(function() {
            me.stepBy(-1000 / 60);
        });
        $('#motionstudio .motion-studio-step-forward').click(function() {
            me.stepBy(1000 / 60);
        });
        $('#motionstudio-timeline').on('input change', function() {
            if (!me.surface || !me.lastSurfaceState) {
                return;
            }
            me.surface.seek(
                me.lastSurfaceState.durationMs *
                (Number(this.value) / 1000)
            );
        });
        $('#motionstudio-speed').change(function() {
            if (me.surface) {
                me.surface.setPlaybackRate(Number($(this).val()));
            }
            me.saveSessionPreset();
        });
        $('#motionstudio-loop').change(function() {
            if (me.surface) {
                me.surface.setLoop(this.checked);
            }
            me.saveSessionPreset();
        });
        $('#motionstudio .motion-studio-copy').click(function() {
            me.copyJson();
        });
        $('#motionstudio .motion-studio-apply-json').click(function() {
            me.applyJson();
        });
        $('#motionstudio-lock-wind-seed').change(function() {
            me.updateWindSeed(
                me.playbook && me.playbook.wind
                    ? me.playbook.wind.seed
                    : null,
                this.checked
            );
        });
        $('#motionstudio .motion-studio-new-wind').click(function() {
            me.newWindVariation();
        });
        $('#motionstudio .motion-studio-apply-preview').click(function() {
            me.applyAndPreview();
        });
        $('#motionstudio .motion-studio-json').on('toggle', function() {
            me.saveSessionPreset();
        });

        $(document).on('keydown.motionstudio', function(event) {
            if (!me.opened) {
                return;
            }
            if (event.key === 'Tab') {
                me.trapFocus(event);
                return;
            }
            if (event.key === 'Escape' &&
                    $(event.target).is('input, textarea, select')) {
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                me.close();
                return;
            }
            if ($(event.target).is(
                    'input, textarea, select, button, a, summary'
                )) {
                return;
            }
            if (event.key === ' ' || event.code === 'Space') {
                event.preventDefault();
                me.togglePlayback();
            } else if (event.key === 'r' || event.key === 'R') {
                event.preventDefault();
                me.replay();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                me.stepBy(event.shiftKey ? -100 : -1000 / 60);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                me.stepBy(event.shiftKey ? 100 : 1000 / 60);
            }
        });
    },

    open: function(options) {
        var me = this;
        var settings = options || {};
        var previewToken = settings.previewToken;
        var ownsPreview =
            previewToken !== undefined &&
            previewToken !== null &&
            previewToken === this.pendingPreviewToken;

        if (ownsPreview) {
            this.pendingPreviewToken = null;
            this.previewingLobby = false;
        } else {
            this.invalidatePreviewOwnership();
        }

        if (this.opened) {
            return;
        }
        this.opened = true;
        this.lastHelperPlanRevision = null;
        $('#motionstudio')
            .addClass('motion-studio-open')
            .attr('aria-hidden', 'false');
        this.setContentScale(this.getContentScale());
        $('#motionstudio .motion-studio-loading')
            .removeClass('ready')
            .text('Preparing Three.js preview\u2026');
        this.setControlStatus('', false);
        this.setJsonStatus('', false);
        $('body').addClass('motion-studio-active');
        this.graphics.openMotionStudio(
            document.getElementById('motionstudio-canvas-host'),
            {
                onReady: function() {
                    var state;
                    $('#motionstudio .motion-studio-loading').addClass('ready');
                    if (me.surface) {
                        if (me.reducedMotion &&
                                !$('#motionstudio-auto-replay')
                                    .is(':checked')) {
                            state = me.surface.getDebugState();
                            me.surface.seek(state.durationMs);
                            me.setControlStatus(
                                'Reduced motion is active; preview starts paused.',
                                false
                            );
                        } else {
                            me.surface.restart();
                        }
                    }
                },
                onError: function(error) {
                    me.showLoadError(
                        error && error.message
                            ? error.message
                            : 'The Motion Studio preview failed.'
                    );
                },
                onStateChange: function(state) {
                    me.onSurfaceState(state);
                }
            },
            function(error, surface, api) {
                if (!me.opened) {
                    return;
                }
                if (error) {
                    me.showLoadError(
                        error.message || 'Three.js could not be loaded.'
                    );
                    return;
                }
                me.surface = surface;
                me.api = api;
                me.loadInitialPreset();
                me.surface.setLoop($('#motionstudio-loop').is(':checked'));
                me.surface.setPlaybackRate(
                    Number($('#motionstudio-speed').val())
                );
            }
        );
        window.setTimeout(function() {
            var root = document.getElementById('motionstudio');
            if (root && root.focus) {
                try {
                    root.focus({preventScroll: true});
                } catch (error) {
                    root.focus();
                }
            }
            if (root) {
                root.scrollLeft = 0;
                root.scrollTop = 0;
            }
        }, 0);
    },

    close: function(options) {
        var settings = options || {};
        if (settings.preservePreview !== true) {
            this.invalidatePreviewOwnership();
        }
        if (!this.opened) {
            return;
        }
        this.opened = false;
        if (this.replayTimer !== null) {
            window.clearTimeout(this.replayTimer);
            this.replayTimer = null;
        }
        this.saveSessionPreset();
        this.graphics.closeMotionStudio();
        this.surface = null;
        this.api = null;
        this.lastSurfaceState = null;
        this.lastHelperPlanRevision = null;
        this.helperDrag = null;
        $('#motionstudio')
            .removeClass('motion-studio-open')
            .attr('aria-hidden', 'true');
        $('body').removeClass('motion-studio-active');
        if (this.lastTrigger &&
                document.documentElement.contains(this.lastTrigger) &&
                $(this.lastTrigger).is(':visible')) {
            this.lastTrigger.focus();
        } else if (document.getElementById('title-icon')) {
            $('#title-icon')
                .attr('tabindex', '-1')
                .focus();
        }
    },

    invalidatePreviewOwnership: function() {
        this.previewGeneration += 1;
        this.pendingPreviewToken = null;
        this.previewingLobby = false;
    },

    loadInitialPreset: function() {
        var stored = null;
        var session = null;
        var ui = null;
        var storedPlaybook;
        var storedPresetNames;
        var storedCoinPreset;

        if (!this.api || !this.api.playbook) {
            throw new Error(
                'The application motion playbook API is unavailable.'
            );
        }
        this.activeTargetId = 'lobby-card-1-intro';
        this.activePresetName = 'custom';
        this.basePresetName = 'casual-toss';
        this.targetPresetNames = {};
        try {
            storedPlaybook = this.graphics.getLobbyPlaybook();
            this.playbook = this.api.playbook.normalize(
                storedPlaybook || this.api.playbook.defaults
            );
        } catch (error) {
            this.playbook = this.api.playbook.normalize(
                this.api.playbook.defaults
            );
        }
        if (!this.api.coin) {
            throw new Error(
                'The turn-marker motion API is unavailable.'
            );
        }
        try {
            storedCoinPreset =
                this.graphics.getTurnMarkerMotionProfile();
            this.coinPreset = this.api.coin.normalize(
                storedCoinPreset || this.api.coin.defaults
            );
        } catch (error) {
            this.coinPreset = this.api.coin.normalize(
                this.api.coin.defaults
            );
        }
        try {
            stored = window.sessionStorage.getItem(this.storageKey);
        } catch (error) {
            stored = null;
        }

        if (stored) {
            try {
                session = JSON.parse(stored);
                if (session &&
                        session.studioSessionVersion ===
                            this.sessionVersion) {
                    if (typeof session.draftPlaybook === 'string') {
                        this.playbook = this.api.playbook.parse(
                            session.draftPlaybook
                        );
                    }
                    if (typeof session.draftTurnMarkerPreset ===
                            'string') {
                        this.coinPreset = this.api.coin.parse(
                            session.draftTurnMarkerPreset
                        );
                    }
                    if (session.coinPreviewDirection ===
                            'opponent-to-player') {
                        this.coinPreviewDirection =
                            'opponent-to-player';
                    }
                    if (session.activeTargetId) {
                        this.activeTargetId =
                            String(session.activeTargetId);
                    }
                    storedPresetNames = session.targetPresetNames;
                    if (storedPresetNames &&
                            typeof storedPresetNames === 'object') {
                        $.each(
                            storedPresetNames,
                            function(targetId, presetName) {
                                presetName = String(presetName);
                                if (this.api.presets[presetName]) {
                                    this.targetPresetNames[
                                        String(targetId)
                                    ] = presetName;
                                }
                            }.bind(this)
                        );
                    } else if (session.activePresetName &&
                            this.api.presets[
                                String(session.activePresetName)
                            ]) {
                        this.targetPresetNames[this.activeTargetId] =
                            String(session.activePresetName);
                    }
                    if (session.basePresetName &&
                            this.api.presets[
                                String(session.basePresetName)
                            ]) {
                        this.basePresetName =
                            String(session.basePresetName);
                    }
                    ui = session.ui || {};
                    if (typeof ui.autoReplay === 'boolean') {
                        $('#motionstudio-auto-replay')
                            .prop('checked', ui.autoReplay);
                    }
                    if (typeof ui.helpers === 'boolean') {
                        $('#motionstudio-show-helpers')
                            .prop('checked', ui.helpers);
                    }
                    if (typeof ui.recipeOpen === 'boolean') {
                        $('#motionstudio .motion-studio-json')
                            .prop('open', ui.recipeOpen);
                    }
                    if (typeof ui.loop === 'boolean') {
                        $('#motionstudio-loop').prop('checked', ui.loop);
                    }
                    if ($.inArray(
                            String(ui.playbackRate),
                            ['0.25', '0.5', '1', '2']
                        ) !== -1) {
                        $('#motionstudio-speed')
                            .val(String(ui.playbackRate));
                    }
                }
            } catch (error) {
                session = null;
            }
        }
        if (this.reducedMotion) {
            $('#motionstudio-auto-replay').prop('checked', false);
        }
        $('#motionstudio-preview')
            .toggleClass(
                'helpers-hidden',
                !$('#motionstudio-show-helpers').is(':checked')
            );
        $('#motionstudio-coin-direction').val(
            this.coinPreviewDirection
        );
        this.selectTarget(this.activeTargetId, false);
    },

    previewCardIndex: function() {
        if (this.activeTarget &&
                this.activeTarget.kind === 'intro') {
            return Number(this.activeTarget.slotIndex) || 0;
        }
        return 2;
    },

    isCoinTarget: function(targetId) {
        return String(
            targetId == null
                ? this.activeTargetId
                : targetId
        ) === this.coinTargetId;
    },

    selectTarget: function(targetId, replayImmediately) {
        var definition;
        var entry;
        if (!this.api || !this.api.playbook || !this.playbook) {
            return;
        }
        if (this.isCoinTarget(targetId)) {
            definition = {
                id: this.coinTargetId,
                label: 'Match turn coin \u2014 Transition',
                kind: 'coin',
                domain: 'active-match'
            };
            this.activeTargetId = definition.id;
            this.activeTarget = definition;
            this.entryDelayMs = 0;
            this.preset = this.api.coin.normalize(
                this.coinPreset || this.api.coin.defaults
            );
            this.activePresetName = 'custom';
            this.syncTargetUi(definition);
            this.setControlStatus('', false);
            this.applyPresetToSurface(
                replayImmediately === true,
                replayImmediately !== true
            );
            return;
        }
        try {
            definition = this.api.playbook.getTargetDefinition(targetId);
        } catch (error) {
            definition = this.api.playbook.targets[0];
        }
        entry = this.api.playbook.getTarget(
            this.playbook,
            definition.id
        );
        this.activeTargetId = definition.id;
        this.activeTarget = definition;
        this.entryDelayMs = Number(entry.delayMs) || 0;
        this.preset = this.api.normalizePreset(entry.preset);
        this.activePresetName =
            this.presetMatchesNamed(
                this.targetPresetNames[definition.id],
                this.preset,
                definition.id
            )
                ? this.targetPresetNames[definition.id]
                : 'custom';
        if (this.targetPresetNames[definition.id] &&
                this.api.presets[
                    this.targetPresetNames[definition.id]
                ]) {
            this.basePresetName =
                this.targetPresetNames[definition.id];
        }
        this.syncTargetUi(definition);
        this.setControlStatus('', false);
        this.applyPresetToSurface(
            replayImmediately === true,
            replayImmediately !== true
        );
    },

    syncTargetUi: function(definition) {
        var isCoin = definition.kind === 'coin';
        $('#motionstudio-target').val(this.activeTargetId);
        $('#motionstudio').toggleClass(
            'motion-studio-exit-target',
            definition.kind === 'exit'
        ).toggleClass(
            'motion-studio-coin-target',
            isCoin
        );
        $('#motionstudio .motion-studio-heading span').text(
            isCoin
                ? 'Active-match turn-indicator motion profile'
                : 'Lobby card animation playbook'
        );
        $('.motion-studio-wind-tools').toggle(
            definition.kind === 'exit'
        );
        $('.motion-studio-marker-start text').text(
            isCoin
                ? 'LOCKED SOURCE'
                : (definition.kind === 'exit'
                ? 'WIND END'
                : 'START')
        );
        $('.motion-studio-preview-hint').html(
            isCoin
                ? 'Endpoints are locked; tune the coin\u2019s <strong>flight</strong>'
                : (definition.kind === 'exit'
                ? 'Adjust <strong>Travel</strong>; the lobby origin is locked'
                : 'Drag <strong>START</strong>; the application target is locked')
        );
        $('#motionstudio .motion-studio-apply-preview').text(
            isCoin
                ? 'Apply to Match Coin'
                : 'Apply & Preview in Lobby'
        );
        $('#motionstudio .motion-studio-reset').text(
            isCoin ? 'Reset coin' : 'Reset target'
        );
        $('#motionstudio .motion-studio-json summary').text(
            isCoin
                ? 'Advanced coin profile data'
                : 'Advanced playbook data'
        );
        $('#motionstudio .motion-studio-copy').text(
            isCoin ? 'Export Profile' : 'Export Playbook'
        );
        $('#motionstudio .motion-studio-apply-json').text(
            isCoin ? 'Import Profile' : 'Import Playbook'
        );
        $('#motionstudio-preset').prop('disabled', isCoin);
        $('#motionstudio-coin-direction')
            .val(this.coinPreviewDirection);
        $('#motionstudio .motion-studio-control').each(function() {
            var subject = $(this).attr('data-motion-subject');
            $(this).toggle(
                subject === 'shared' ||
                (isCoin ? subject === 'coin' : subject === 'card')
            );
        });
        $('#motionstudio-scale-mode')
            .closest('.motion-studio-select-row')
            .toggle(!isCoin);
        $('[data-motion-field="entry.delayMs"]')
            .closest('.motion-studio-control')
            .find('label')
            .text(
                definition.kind === 'exit'
                    ? 'Pickup cadence'
                    : 'Start delay'
            );
        $('[data-motion-field="entry.delayMs"]' +
            '[data-motion-control="number"]').attr(
                'aria-label',
                definition.kind === 'exit'
                    ? 'Pickup cadence value'
                    : 'Start delay value'
            );
        this.previewCardKey = null;
        this.syncIntroCopyUi();
        this.syncWindUi();
    },

    presetMatchesNamed: function(name, preset, targetId) {
        var referencePlaybook;
        var referencePreset;
        if (!name || name === 'custom' || !this.api ||
                !this.api.playbook || !this.api.presets[name] ||
                !preset || !targetId) {
            return false;
        }
        try {
            referencePlaybook = this.api.playbook.updateTarget(
                this.api.playbook.defaults,
                targetId,
                this.api.presets[name],
                0
            );
            referencePreset = this.api.playbook.getTarget(
                referencePlaybook,
                targetId
            ).preset;
            return JSON.stringify(this.api.normalizePreset(preset)) ===
                JSON.stringify(this.api.normalizePreset(referencePreset));
        } catch (error) {
            return false;
        }
    },

    selectPreset: function(name) {
        if (this.isCoinTarget()) {
            return;
        }
        if (!this.api || !this.api.presets[name]) {
            return;
        }
        this.activePresetName = name;
        this.basePresetName = name;
        if (this.activeTargetId) {
            this.targetPresetNames[this.activeTargetId] = name;
        }
        this.preset = this.api.normalizePreset(this.api.presets[name]);
        this.setControlStatus('', false);
        this.applyPresetToSurface(true);
    },

    resetActiveTarget: function() {
        var defaultEntry;
        var sourceName;
        if (this.isCoinTarget()) {
            if (!this.api || !this.api.coin) {
                return;
            }
            this.coinPreset = this.api.coin.normalize(
                this.api.coin.defaults
            );
            this.preset = this.coinPreset;
            this.activePresetName = 'custom';
            this.setControlStatus(
                'The match turn coin was restored to its application default.',
                false
            );
            this.applyPresetToSurface(true);
            return;
        }
        if (!this.api || !this.api.playbook ||
                !this.playbook || !this.activeTarget) {
            return;
        }
        sourceName = this.targetPresetNames[this.activeTargetId];
        defaultEntry = this.api.playbook.getTarget(
            this.api.playbook.defaults,
            this.activeTargetId
        );
        if (sourceName && this.api.presets[sourceName]) {
            defaultEntry = {
                delayMs: defaultEntry.delayMs,
                preset: this.api.presets[sourceName]
            };
        }
        this.entryDelayMs = Number(defaultEntry.delayMs) || 0;
        this.preset = this.api.normalizePreset(defaultEntry.preset);
        this.activePresetName =
            sourceName && this.api.presets[sourceName]
                ? sourceName
                : 'custom';
        this.setControlStatus(
            this.activeTarget.label + ' restored to ' +
                (
                    this.activePresetName === 'custom'
                        ? 'its application default.'
                        : this.titleCase(this.activePresetName) + '.'
                ),
            false
        );
        this.applyPresetToSurface(true);
    },

    syncIntroCopyUi: function() {
        var me = this;
        var isIntro = this.activeTarget &&
            this.activeTarget.kind === 'intro';
        var $section = $('#motionstudio .motion-studio-intro-copy');
        var $select = $('#motionstudio-copy-target');

        $section.attr('aria-hidden', isIntro ? 'false' : 'true');
        $select
            .empty()
            .append(
                $('<option></option>')
                    .val('')
                    .text('Choose lobby card\u2026')
            )
            .append(
                $('<option></option>')
                    .val('all')
                    .text('All other lobby intro cards')
            );
        if (isIntro && this.api && this.api.playbook) {
            $.each(this.api.playbook.targets, function(index, target) {
                if (target.kind !== 'intro' ||
                        target.id === me.activeTargetId) {
                    return;
                }
                $select.append(
                    $('<option></option>')
                        .val(target.id)
                        .text(target.label)
                );
            });
        }
        $select
            .val('')
            .prop('disabled', !isIntro);
        $('#motionstudio .motion-studio-copy-intro')
            .prop('disabled', true);
    },

    copyIntroSharedMotion: function() {
        var selection;
        var destinationIds = [];
        var destinationLabels = [];
        var me = this;

        if (!this.api || !this.api.playbook ||
                !this.playbook || !this.preset ||
                !this.activeTarget ||
                this.activeTarget.kind !== 'intro') {
            return;
        }
        selection = $('#motionstudio-copy-target').val();
        if (!selection) {
            this.setControlStatus(
                'Choose a lobby intro destination first.',
                true
            );
            return;
        }
        $.each(this.api.playbook.targets, function(index, target) {
            if (target.kind !== 'intro' ||
                    target.id === me.activeTargetId) {
                return;
            }
            if (selection === 'all' || selection === target.id) {
                destinationIds.push(target.id);
                destinationLabels.push(target.label);
            }
        });
        if (destinationIds.length === 0) {
            this.setControlStatus(
                'The selected lobby intro destination is unavailable.',
                true
            );
            this.syncIntroCopyUi();
            return;
        }
        try {
            this.playbook = this.api.playbook.updateTarget(
                this.playbook,
                this.activeTargetId,
                this.preset,
                this.entryDelayMs
            );
            this.playbook =
                this.api.playbook.copyIntroSharedMotion(
                    this.playbook,
                    this.activeTargetId,
                    destinationIds
                );
            $.each(destinationIds, function(index, targetId) {
                delete me.targetPresetNames[targetId];
            });
            this.updateRecipeJson();
            this.saveSessionPreset();
            this.syncIntroCopyUi();
            this.setControlStatus(
                'Copied shared motion to ' +
                    destinationLabels.join(', ') +
                    '. Each card kept its start delay, heading, ' +
                    'distance, and curve.',
                false
            );
        } catch (error) {
            this.setControlStatus(
                error && error.message
                    ? error.message
                    : 'The shared intro motion could not be copied.',
                true
            );
        }
    },

    onControlChange: function(control, eventType) {
        var field = $(control).attr('data-motion-field');
        var value;
        var minimum;
        var maximum;
        var candidate;

        if (!this.api || !this.preset || !field) {
            return;
        }
        if (field === 'scale.mode') {
            value = $(control).val();
        } else {
            value = Number($(control).val());
            if (!isFinite(value)) {
                this.syncUiFromPreset();
                return;
            }
            minimum = Number($(control).attr('min'));
            maximum = Number($(control).attr('max'));
            if (isFinite(minimum)) {
                value = Math.max(minimum, value);
            }
            if (isFinite(maximum)) {
                value = Math.min(maximum, value);
            }
        }
        if (field === 'entry.delayMs') {
            this.entryDelayMs = value;
            this.activePresetName = 'custom';
            this.setControlStatus('', false);
            this.applyPresetToSurface(
                false,
                eventType === 'input' &&
                    $(control).is('input[type="range"]')
            );
            return;
        }
        candidate = this.clonePreset(this.preset);
        this.setNestedValue(candidate, field, value);
        try {
            candidate = this.isCoinTarget()
                ? this.api.coin.normalize(candidate)
                : this.api.normalizePreset(candidate);
        } catch (error) {
            this.syncUiFromPreset();
            this.setControlStatus(
                error && error.message
                    ? error.message
                    : 'That combination cannot be previewed safely.',
                true
            );
            return;
        }
        this.preset = candidate;
        this.activePresetName = 'custom';
        this.setControlStatus('', false);
        this.applyPresetToSurface(
            false,
            eventType === 'input' &&
                $(control).is('input[type="range"]')
        );
    },

    applyPresetToSurface: function(replayImmediately, suppressAutoReplay) {
        var me = this;
        var batch;
        var plan;
        var card;
        var cardKey;
        if (this.isCoinTarget()) {
            this.applyCoinPresetToSurface(
                replayImmediately,
                suppressAutoReplay
            );
            return;
        }
        if (!this.preset || !this.api || !this.api.playbook ||
                !this.playbook || !this.activeTarget) {
            return;
        }
        try {
            this.playbook = this.api.playbook.updateTarget(
                this.playbook,
                this.activeTargetId,
                this.preset,
                this.entryDelayMs
            );
            this.preset = this.api.normalizePreset(
                this.api.playbook.getTarget(
                    this.playbook,
                    this.activeTargetId
                ).preset
            );
            this.entryDelayMs = Number(
                this.api.playbook.getTarget(
                    this.playbook,
                    this.activeTargetId
                ).delayMs
            ) || 0;
            batch = this.createPreviewBatch();
            plan = this.findPreviewPlan(batch);
            this.previewPlan = plan;
        } catch (error) {
            this.setControlStatus(
                error && error.message
                    ? error.message
                    : 'That application animation cannot be previewed.',
                true
            );
            return;
        }
        this.syncUiFromPreset();
        this.syncWindUi();
        this.updateRecipeJson();
        this.saveSessionPreset();
        if (this.surface) {
            try {
                this.surface.setMotionContext({
                    direction: this.activeTarget.kind,
                    destination: plan.anchor,
                    delayMs: plan.delayMs,
                    targetId: this.activeTargetId
                });
                this.surface.setPreset(plan.effectivePreset);
                card = this.getCard(plan.cardIndex);
                if (!card) {
                    throw new Error(
                        'The selected lobby card is unavailable.'
                    );
                }
                cardKey = String(card.textureUrl) + '|' +
                    String(card.backTextureUrl);
                if (this.previewCardKey !== cardKey) {
                    this.previewCardKey = cardKey;
                    this.surface.setCard(card);
                }
            } catch (error) {
                this.setControlStatus(
                    error && error.message
                        ? error.message
                        : 'That combination cannot be previewed safely.',
                    true
                );
                return;
            }
        }
        if (this.replayTimer !== null) {
            window.clearTimeout(this.replayTimer);
            this.replayTimer = null;
        }
        if (replayImmediately) {
            this.replay();
        } else if (!suppressAutoReplay &&
                $('#motionstudio-auto-replay').is(':checked')) {
            this.replayTimer = window.setTimeout(function() {
                me.replayTimer = null;
                me.replay();
            }, 120);
        }
    },

    applyCoinPresetToSurface: function(
        replayImmediately,
        suppressAutoReplay
    ) {
        var me = this;
        var positions;
        var source;
        var destination;
        var descriptor;
        var plan;
        if (!this.preset || !this.api || !this.api.coin) {
            return;
        }
        try {
            this.coinPreset =
                this.api.coin.normalize(this.preset);
            this.preset = this.coinPreset;
            positions = this.api.coin.positions || {
                player: {x: 53.5, y: 440.5},
                opponent: {x: 641.5, y: 440.5}
            };
            if (this.coinPreviewDirection ===
                    'opponent-to-player') {
                source = positions.opponent;
                destination = positions.player;
            } else {
                source = positions.player;
                destination = positions.opponent;
            }
            descriptor = {
                textureUrl: '/images/dime-heads.png',
                source: {
                    x: Number(source.x),
                    y: Number(source.y)
                },
                destination: {
                    x: Number(destination.x),
                    y: Number(destination.y)
                },
                direction: this.coinPreviewDirection
            };
            plan = this.api.coin.createPlan(
                this.coinPreset,
                {
                    source: descriptor.source,
                    destination: descriptor.destination
                }
            );
            this.previewPlan = plan;
            if (this.surface) {
                if (this.surface.setCoinProfile) {
                    this.surface.setCoinProfile(
                        this.coinPreset
                    );
                }
                this.surface.setCoin(descriptor);
            }
        } catch (error) {
            this.setControlStatus(
                error && error.message
                    ? error.message
                    : 'That coin motion cannot be previewed safely.',
                true
            );
            return;
        }
        this.syncUiFromPreset();
        this.updateRecipeJson();
        this.saveSessionPreset();
        if (this.replayTimer !== null) {
            window.clearTimeout(this.replayTimer);
            this.replayTimer = null;
        }
        if (replayImmediately) {
            this.replay();
        } else if (!suppressAutoReplay &&
                $('#motionstudio-auto-replay').is(':checked')) {
            this.replayTimer = window.setTimeout(function() {
                me.replayTimer = null;
                me.replay();
            }, 120);
        }
    },

    createPreviewBatch: function() {
        var cards = this.getCards() || [];
        var fallbackCard;
        var index;
        cards = $.map(cards.slice(0, 5), function(card, cardIndex) {
            var descriptor = $.extend({}, card);
            if (!isFinite(Number(descriptor.index))) {
                descriptor.index = cardIndex;
            }
            return descriptor;
        });
        if (cards.length === 0) {
            for (index = 0; index < 5; index += 1) {
                fallbackCard = this.getCard(index);
                if (fallbackCard) {
                    fallbackCard = $.extend({}, fallbackCard);
                    fallbackCard.index = index;
                    cards.push(fallbackCard);
                }
            }
        }
        return this.api.playbook.createBatch(
            this.playbook,
            this.activeTarget.kind,
            cards,
            {
                id: 'motion-studio-' + this.activeTargetId,
                trigger: 'motion-studio-workbench',
                seed: this.playbook.wind.seed
            }
        );
    },

    findPreviewPlan: function(batch) {
        var requestedCardIndex = this.previewCardIndex();
        var plan = null;
        $.each(batch.plans || [], function(index, candidate) {
            if (Number(candidate.cardIndex) === requestedCardIndex) {
                plan = candidate;
                return false;
            }
        });
        plan = plan || (batch.plans && batch.plans[0]);
        if (!plan) {
            throw new Error(
                'The selected animation has no lobby card to preview.'
            );
        }
        return plan;
    },

    syncUiFromPreset: function() {
        var me = this;
        var isCoin = this.isCoinTarget();
        if (!this.preset) {
            return;
        }
        if (!isCoin) {
            $('#motionstudio-preset').val(
                this.activePresetName === 'custom'
                    ? 'custom'
                    : this.activePresetName
            );
            $('#motionstudio-scale-mode').val(this.preset.scale.mode);
        }
        $('#motionstudio').toggleClass(
            'motion-studio-keyframed',
            !isCoin &&
                this.preset.scale.mode === 'keyframed'
        );
        $('#motionstudio [data-motion-field]').each(function() {
            var field = $(this).attr('data-motion-field');
            var value;
            if (field === 'scale.mode') {
                return;
            }
            value = field === 'entry.delayMs'
                ? me.entryDelayMs
                : me.getNestedValue(me.preset, field);
            if (value !== undefined) {
                $(this).val(value);
            }
        });
    },

    syncWindUi: function() {
        if (!this.playbook || !this.playbook.wind) {
            return;
        }
        $('#motionstudio-lock-wind-seed').prop(
            'checked',
            this.playbook.wind.locked === true
        );
        $('#motionstudio-wind-seed').text(
            this.playbook.wind.seed
        );
    },

    updateWindSeed: function(seed, locked) {
        if (!this.api || !this.api.playbook || !this.playbook) {
            return;
        }
        try {
            this.playbook = this.api.playbook.updateWindSeed(
                this.playbook,
                seed || this.playbook.wind.seed,
                locked === true
            );
            this.syncWindUi();
            this.updateRecipeJson();
            this.saveSessionPreset();
            if (this.activeTarget &&
                    this.activeTarget.kind === 'exit') {
                this.applyPresetToSurface(true);
            }
        } catch (error) {
            this.setControlStatus(
                error && error.message
                    ? error.message
                    : 'The wind variation could not be updated.',
                true
            );
        }
    },

    newWindVariation: function() {
        if (!this.playbook || !this.playbook.wind) {
            return;
        }
        this.updateWindSeed(
            this.graphics.nextWindSeed('studio-wind'),
            this.playbook.wind.locked === true
        );
    },

    replay: function() {
        if (this.surface) {
            this.surface.restart();
        }
    },

    togglePlayback: function() {
        if (!this.surface) {
            return;
        }
        if (this.lastSurfaceState && this.lastSurfaceState.playing) {
            this.surface.pause();
        } else {
            this.surface.play();
        }
    },

    stepBy: function(deltaMs) {
        if (!this.surface || !this.lastSurfaceState) {
            return;
        }
        this.surface.seek(this.lastSurfaceState.elapsedMs + deltaMs);
    },

    beginHelperDrag: function(name, event) {
        if (this.isCoinTarget() ||
                !this.preset || !this.lastSurfaceState ||
                !this.lastSurfaceState.plan) {
            return;
        }
        event.preventDefault();
        this.helperDrag = {name: name};
        if (this.surface) {
            this.surface.pause();
        }
        this.moveHelperDrag(event);
    },

    moveHelperDrag: function(event) {
        var svg;
        var rect;
        var x;
        var y;
        var plan;
        var destination;
        var deltaX;
        var deltaY;
        var changes;
        var nativeEvent;

        if (!this.helperDrag || !this.preset ||
                !this.lastSurfaceState ||
                !this.lastSurfaceState.plan) {
            return;
        }
        event.preventDefault();
        nativeEvent = event.originalEvent || event;
        svg = document.querySelector('#motionstudio .motion-studio-helpers');
        if (!svg) {
            return;
        }
        rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return;
        }
        x = Math.max(
            0,
            Math.min(
                755,
                ((nativeEvent.clientX - rect.left) / rect.width) * 755
            )
        );
        y = Math.max(
            0,
            Math.min(
                562,
                ((nativeEvent.clientY - rect.top) / rect.height) * 562
            )
        );
        if (!isFinite(x) || !isFinite(y)) {
            return;
        }
        plan = this.lastSurfaceState.plan;
        destination = plan.path.destination;
        deltaX = x - destination.x;
        deltaY = y - destination.y;
        changes = {
            'path.directionDeg':
                Math.round(
                    Math.atan2(-deltaY, -deltaX) * 180 / Math.PI
                ),
            'path.distancePx': Math.round(
                Math.min(
                    1000,
                    Math.sqrt(
                        (deltaX * deltaX) + (deltaY * deltaY)
                    )
                )
            )
        };
        this.applyDraftChanges(changes, true);
    },

    endHelperDrag: function() {
        if (!this.helperDrag) {
            return;
        }
        this.helperDrag = null;
        if ($('#motionstudio-auto-replay').is(':checked')) {
            this.replay();
        }
    },

    applyDraftChanges: function(changes, suppressAutoReplay) {
        var me = this;
        var candidate;
        if (!this.api || !this.preset) {
            return;
        }
        candidate = this.clonePreset(this.preset);
        $.each(changes, function(path, value) {
            me.setNestedValue(candidate, path, value);
        });
        try {
            candidate = this.isCoinTarget()
                ? this.api.coin.normalize(candidate)
                : this.api.normalizePreset(candidate);
        } catch (error) {
            this.setControlStatus(
                error && error.message
                    ? error.message
                    : 'That path cannot be previewed safely.',
                true
            );
            return;
        }
        this.preset = candidate;
        this.activePresetName = 'custom';
        this.setControlStatus('', false);
        this.applyPresetToSurface(false, suppressAutoReplay === true);
    },

    onSurfaceState: function(state) {
        var pose = state.pose || {};
        this.lastSurfaceState = state;
        $('#motionstudio-timeline').val(
            state.durationMs > 0
                ? Math.round((state.elapsedMs / state.durationMs) * 1000)
                : 0
        );
        $('#motionstudio-time').text(
            Math.round(state.elapsedMs) +
            ' / ' +
            Math.round(state.durationMs) +
            ' ms'
        );
        $('#motionstudio .motion-studio-play').text(
            state.playing ? 'Pause' : 'Play'
        );
        this.setReadout('phase', this.titleCase(pose.phase || 'ready'));
        this.setReadout('height', Number(pose.height || 0).toFixed(1));
        this.setReadout(
            'perspectiveScale',
            Number(state.perspectiveScale || 1).toFixed(2) + '\u00d7'
        );
        this.setReadout(
            'authoredScale',
            Number(pose.authoredScale || 1).toFixed(2) + '\u00d7'
        );
        this.setReadout(
            'renderedScale',
            Number(state.renderedScale || 1).toFixed(2) + '\u00d7'
        );
        this.setReadout('face', state.visibleFace || 'Front');
        if (state.plan &&
                state.planRevision !== this.lastHelperPlanRevision) {
            this.lastHelperPlanRevision = state.planRevision;
            this.updateHelpers(
                state.plan,
                state.motionContext,
                state.subjectKind
            );
        }
    },

    updateHelpers: function(plan, motionContext, subjectKind) {
        var sample;
        var points = [];
        var index;
        var total;
        var releaseAt;
        var flightDuration;
        var contactAt;
        var flatAt;
        var direction;
        var exitDelay;
        var motionDuration;
        var apexAt;

        if (!this.api || !plan) {
            return;
        }
        if (subjectKind === 'coin' || this.isCoinTarget()) {
            this.updateCoinHelpers(plan, motionContext);
            return;
        }
        direction = motionContext &&
            motionContext.direction === 'exit'
            ? 'exit'
            : 'intro';
        motionDuration = plan.timing.motionMs || 1;
        exitDelay = direction === 'exit'
            ? Number(motionContext.delayMs) || 0
            : 0;
        total = direction === 'exit'
            ? exitDelay + motionDuration
            : plan.timing.totalMs || 1;
        releaseAt = plan.timing.delayMs || 0;
        flightDuration = plan.timing.flightMs;
        contactAt = releaseAt + flightDuration;
        flatAt = contactAt + plan.timing.slapMs;
        apexAt = releaseAt +
            (flightDuration * plan.path.apexProgress);
        for (index = 0; index <= 24; index += 1) {
            sample = this.api.samplePlan(
                plan,
                releaseAt + (flightDuration * (index / 24))
            );
            points.push(
                (index === 0 ? 'M ' : 'L ') +
                sample.screenX.toFixed(2) +
                ' ' +
                sample.screenY.toFixed(2)
            );
        }
        $('.motion-studio-path').attr('d', points.join(' '));
        $('.motion-studio-skid-path').attr({
            x1: plan.path.contact.x,
            y1: plan.path.contact.y,
            x2: plan.path.destination.x,
            y2: plan.path.destination.y
        });
        this.placeMarker('start', plan.path.start.x, plan.path.start.y);
        this.placeMarker(
            'destination',
            plan.path.destination.x,
            plan.path.destination.y
        );
        sample = this.api.samplePlan(
            plan,
            releaseAt + (flightDuration * plan.path.apexProgress)
        );
        this.placeMarker('apex', sample.screenX, sample.screenY);
        this.placeMarker(
            'contact',
            plan.path.contact.x,
            plan.path.contact.y
        );
        this.placeMarker(
            'land',
            plan.path.destination.x,
            plan.path.destination.y
        );
        if (direction === 'exit') {
            this.placeTimelineMarker(
                'settled',
                exitDelay / total
            );
            this.placeTimelineMarker(
                'flat',
                (
                    exitDelay +
                    Math.max(0, motionDuration - flatAt)
                ) / total
            );
            this.placeTimelineMarker(
                'contact',
                (
                    exitDelay +
                    Math.max(0, motionDuration - contactAt)
                ) / total
            );
            this.placeTimelineMarker(
                'apex',
                (
                    exitDelay +
                    Math.max(0, motionDuration - apexAt)
                ) / total
            );
            this.placeTimelineMarker('release', 1);
        } else {
            this.placeTimelineMarker('release', releaseAt / total);
            this.placeTimelineMarker('apex', apexAt / total);
            this.placeTimelineMarker('contact', contactAt / total);
            this.placeTimelineMarker('flat', flatAt / total);
            this.placeTimelineMarker('settled', 1);
        }
    },

    updateCoinHelpers: function(plan, motionContext) {
        var points = [];
        var timing = plan.timing || {};
        var path = plan.path || {};
        var start =
            path.source || path.start || plan.source;
        var destination =
            path.destination || plan.destination;
        var flightMs = Number(timing.flightMs) ||
            Number(path.flightMs) || 1;
        var totalMs = Number(timing.totalMs) ||
            flightMs + (Number(timing.settleMs) || 0);
        var apexProgress =
            Number(path.apexProgress);
        var helperOffset =
            motionContext && motionContext.helperOffset
                ? motionContext.helperOffset
                : {x: 30, y: 30};
        var sample;
        var index;
        var offsetX = Number(helperOffset.x) || 0;
        var offsetY = Number(helperOffset.y) || 0;

        if (!start || !destination ||
                !this.api.coin) {
            return;
        }
        if (!isFinite(apexProgress)) {
            apexProgress = 0.5;
        }
        for (index = 0; index <= 32; index += 1) {
            sample = this.api.coin.samplePlan(
                plan,
                flightMs * (index / 32)
            );
            points.push(
                (index === 0 ? 'M ' : 'L ') +
                (sample.screenX + offsetX).toFixed(2) +
                ' ' +
                (sample.screenY + offsetY).toFixed(2)
            );
        }
        $('.motion-studio-path').attr('d', points.join(' '));
        $('.motion-studio-skid-path').attr({
            x1: destination.x + offsetX,
            y1: destination.y + offsetY,
            x2: destination.x + offsetX,
            y2: destination.y + offsetY
        });
        this.placeMarker(
            'start',
            start.x + offsetX,
            start.y + offsetY
        );
        this.placeMarker(
            'destination',
            destination.x + offsetX,
            destination.y + offsetY
        );
        sample = this.api.coin.samplePlan(
            plan,
            flightMs * apexProgress
        );
        this.placeMarker(
            'apex',
            sample.screenX + offsetX,
            sample.screenY + offsetY
        );
        this.placeMarker(
            'contact',
            destination.x + offsetX,
            destination.y + offsetY
        );
        this.placeMarker(
            'land',
            destination.x + offsetX,
            destination.y + offsetY
        );
        this.placeTimelineMarker('release', 0);
        this.placeTimelineMarker(
            'apex',
            (flightMs * apexProgress) / totalMs
        );
        this.placeTimelineMarker(
            'contact',
            flightMs / totalMs
        );
        this.placeTimelineMarker('flat', 1);
        this.placeTimelineMarker('settled', 1);
    },

    placeMarker: function(name, x, y) {
        $('.motion-studio-marker-' + name)
            .attr('transform', 'translate(' + x + ' ' + y + ')');
    },

    placeTimelineMarker: function(name, progress) {
        var bounded = Math.max(0, Math.min(1, progress));
        $('[data-motion-marker="' + name + '"]')
            .css('left', (bounded * 100) + '%')
            .attr(
                'data-motion-edge',
                bounded < 0.08
                    ? 'left'
                    : (bounded > 0.92 ? 'right' : 'center')
            );
    },

    updateRecipeJson: function() {
        if (this.isCoinTarget() &&
                this.api && this.api.coin && this.coinPreset) {
            $('#motionstudio-json').val(
                this.api.coin.serialize(this.coinPreset)
            );
        } else if (this.api && this.api.playbook && this.playbook) {
            $('#motionstudio-json').val(
                this.api.playbook.serialize(this.playbook)
            );
        }
    },

    copyJson: function() {
        var me = this;
        var text;
        var copied = function() {
            me.setJsonStatus(
                me.isCoinTarget()
                    ? 'Exported the versioned turn-coin profile.'
                    : 'Exported the complete versioned lobby playbook.',
                false
            );
        };
        if (this.isCoinTarget()) {
            if (!this.api || !this.api.coin || !this.coinPreset) {
                this.setJsonStatus(
                    'The turn-coin profile is unavailable for export.',
                    true
                );
                return;
            }
            try {
                text = this.api.coin.serialize(this.coinPreset);
                $('#motionstudio-json').val(text);
            } catch (error) {
                this.setJsonStatus(
                    error && error.message
                        ? error.message
                        : 'The turn-coin profile could not be exported.',
                    true
                );
                return;
            }
            if (navigator.clipboard &&
                    navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(
                    copied,
                    function() {
                        me.fallbackCopy(text, copied);
                    }
                );
            } else {
                this.fallbackCopy(text, copied);
            }
            return;
        }
        if (!this.api || !this.api.playbook || !this.playbook) {
            this.setJsonStatus(
                'The lobby playbook is unavailable for export.',
                true
            );
            return;
        }
        try {
            text = this.api.playbook.serialize(this.playbook);
            $('#motionstudio-json').val(text);
        } catch (error) {
            this.setJsonStatus(
                error && error.message
                    ? error.message
                    : 'The lobby playbook could not be exported.',
                true
            );
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(copied, function() {
                me.fallbackCopy(text, copied);
            });
        } else {
            this.fallbackCopy(text, copied);
        }
    },

    fallbackCopy: function(text, callback) {
        var $textarea = $('#motionstudio-json');
        $textarea.val(text).focus().select();
        try {
            document.execCommand('copy');
            callback();
        } catch (error) {
            this.setJsonStatus('Copy failed; select the JSON manually.', true);
        }
    },

    applyJson: function() {
        var candidate;
        if (this.isCoinTarget()) {
            if (!this.api || !this.api.coin) {
                return;
            }
            try {
                candidate = this.api.coin.parse(
                    $('#motionstudio-json').val()
                );
                this.coinPreset =
                    this.api.coin.normalize(candidate);
                this.preset = this.coinPreset;
                this.applyPresetToSurface(true);
                this.setJsonStatus(
                    'The turn-coin profile was imported into this draft.',
                    false
                );
                this.setControlStatus('', false);
            } catch (error) {
                this.setJsonStatus(
                    error && error.message
                        ? error.message
                        : 'The turn-coin profile is invalid.',
                    true
                );
            }
            return;
        }
        if (!this.api || !this.api.playbook) {
            return;
        }
        try {
            candidate = this.api.playbook.parse(
                $('#motionstudio-json').val()
            );
            this.playbook = this.api.playbook.normalize(
                this.graphics.setLobbyPlaybook(candidate, true)
            );
            this.targetPresetNames = {};
            this.selectTarget(this.activeTargetId, true);
            this.setJsonStatus(
                'The complete lobby playbook was imported.',
                false
            );
            this.setControlStatus('', false);
        } catch (error) {
            this.setJsonStatus(
                error && error.message
                    ? error.message
                    : 'The lobby playbook is invalid.',
                true
            );
        }
    },

    applyAndPreview: function() {
        var me = this;
        var sequence;
        var seed;
        var previewToken;
        var completePreview;
        if (this.isCoinTarget()) {
            if (!this.api || !this.api.coin ||
                    !this.coinPreset || !this.graphics ||
                    !gh.defined(
                        this.graphics.setTurnMarkerMotionProfile,
                        'function'
                    )) {
                this.setControlStatus(
                    'The match turn-coin profile is unavailable.',
                    true
                );
                return;
            }
            try {
                this.coinPreset = this.api.coin.normalize(
                    this.graphics.setTurnMarkerMotionProfile(
                        this.coinPreset,
                        true
                    )
                );
                this.preset = this.coinPreset;
                this.updateRecipeJson();
                this.saveSessionPreset();
                this.setControlStatus(
                    'Applied. Modern match turn changes now use this coin profile.',
                    false
                );
                this.replay();
            } catch (error) {
                this.setControlStatus(
                    error && error.message
                        ? error.message
                        : 'The turn-coin profile could not be applied.',
                    true
                );
            }
            return;
        }
        if (!this.api || !this.playbook || !this.activeTarget ||
                !this.graphics ||
                !gh.defined(
                    this.graphics.previewLobbyPlaybook,
                    'function'
                )) {
            this.setControlStatus(
                'The real lobby preview is unavailable.',
                true
            );
            return;
        }
        try {
            this.playbook = this.api.playbook.normalize(
                this.graphics.setLobbyPlaybook(
                    this.playbook,
                    true
                )
            );
        } catch (error) {
            this.setControlStatus(
                error && error.message
                    ? error.message
                    : 'The lobby playbook could not be applied.',
                true
            );
            return;
        }
        sequence = this.activeTarget.kind;
        seed = this.playbook.wind.seed;
        previewToken = ++this.previewGeneration;
        this.pendingPreviewToken = previewToken;
        this.previewingLobby = true;
        this.saveSessionPreset();
        this.close({preservePreview: true});
        completePreview = function(result) {
            var outcome;
            var canRestore = false;
            if (me.pendingPreviewToken !== previewToken) {
                return;
            }
            try {
                canRestore =
                    me.graphics &&
                    gh.defined(
                        me.graphics.canRestoreMotionStudioPreview,
                        'function'
                    ) &&
                    me.graphics.canRestoreMotionStudioPreview();
            } catch (error) {
                canRestore = false;
            }
            if (!canRestore) {
                me.invalidatePreviewOwnership();
                return;
            }
            outcome = result && result.outcome
                ? String(result.outcome)
                : '';
            me.open({previewToken: previewToken});
            if (outcome &&
                    outcome.indexOf('completed') !== 0 &&
                    outcome !== 'skipped-reduced-motion') {
                window.setTimeout(function() {
                    me.setControlStatus(
                        'The lobby preview ended with "' +
                        outcome + '".',
                        true
                    );
                }, 0);
            }
        };
        try {
            this.graphics.previewLobbyPlaybook(
                sequence,
                {seed: seed},
                completePreview
            );
        } catch (error) {
            completePreview({
                outcome: 'failed',
                sequence: sequence,
                error: error
            });
        }
    },

    saveSessionPreset: function() {
        var draftPlaybook = null;
        var draftTurnMarkerPreset = null;
        var session;
        try {
            if (this.api && this.api.playbook && this.playbook) {
                draftPlaybook =
                    this.api.playbook.serialize(this.playbook);
            }
            if (this.api && this.api.coin && this.coinPreset) {
                draftTurnMarkerPreset =
                    this.api.coin.serialize(this.coinPreset);
            }
            session = {
                studioSessionVersion: this.sessionVersion,
                activeTargetId: this.activeTargetId,
                activePresetName: this.activePresetName,
                basePresetName: this.basePresetName,
                draftPlaybook: draftPlaybook,
                draftTurnMarkerPreset:
                    draftTurnMarkerPreset,
                coinPreviewDirection:
                    this.coinPreviewDirection,
                targetPresetNames: $.extend(
                    {},
                    this.targetPresetNames
                ),
                ui: {
                    autoReplay:
                        $('#motionstudio-auto-replay').is(':checked'),
                    helpers:
                        $('#motionstudio-show-helpers').is(':checked'),
                    recipeOpen:
                        $('#motionstudio .motion-studio-json')
                            .prop('open') === true,
                    loop: $('#motionstudio-loop').is(':checked'),
                    playbackRate: Number(
                        $('#motionstudio-speed').val()
                    )
                }
            };
            window.sessionStorage.setItem(
                this.storageKey,
                JSON.stringify(session)
            );
        } catch (error) {
            // The workbench remains usable without browser storage.
        }
    },

    showLoadError: function(message) {
        $('#motionstudio .motion-studio-loading')
            .removeClass('ready')
            .text(message);
    },

    setJsonStatus: function(message, isError) {
        $('#motionstudio .motion-studio-json-status')
            .toggleClass('error', isError === true)
            .text(message);
    },

    setControlStatus: function(message, isError) {
        $('#motionstudio .motion-studio-control-status')
            .toggleClass('error', isError === true)
            .text(message);
    },

    prefersReducedMotion: function() {
        try {
            return Boolean(
                window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)')
                    .matches
            );
        } catch (error) {
            return false;
        }
    },

    trapFocus: function(event) {
        var elements = $('#motionstudio')
            .find(
                'button, input, select, textarea, summary, ' +
                '[tabindex]:not([tabindex="-1"])'
            )
            .filter(':visible:not([disabled])')
            .get();
        var index;

        if (elements.length === 0) {
            return;
        }
        index = $.inArray(document.activeElement, elements);
        if (event.shiftKey && index <= 0) {
            event.preventDefault();
            elements[elements.length - 1].focus();
        } else if (!event.shiftKey &&
                (index === -1 || index === elements.length - 1)) {
            event.preventDefault();
            elements[0].focus();
        }
    },

    setReadout: function(name, value) {
        var $readout = $('[data-motion-readout="' + name + '"]');
        if ($readout.text() !== String(value)) {
            $readout.text(value);
        }
    },

    getNestedValue: function(object, path) {
        var value = object;
        $.each(path.split('.'), function(index, part) {
            value = value == null ? undefined : value[part];
        });
        return value;
    },

    setNestedValue: function(object, path, value) {
        var parts = path.split('.');
        var target = object;
        var index;
        for (index = 0; index < parts.length - 1; index += 1) {
            target = target[parts[index]];
        }
        target[parts[parts.length - 1]] = value;
    },

    clonePreset: function(preset) {
        return JSON.parse(JSON.stringify(preset));
    },

    titleCase: function(value) {
        return String(value)
            .replace(/-/g, ' ')
            .replace(/\b\w/g, function(letter) {
                return letter.toUpperCase();
            });
    }
};
