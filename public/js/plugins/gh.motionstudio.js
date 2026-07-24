gh.motionstudio = function(options) {
    this.initialize(options || {});
};

gh.motionstudio.prototype = {
    initialize: function(options) {
        var me = this;

        this.graphics = options.graphics;
        this.getCard = options.getCard || function() { return null; };
        this.closeContextMenu = options.closeContextMenu || function() {};
        this.storageKey = 'purett.motionStudio.v1';
        this.sessionVersion = 1;
        this.opened = false;
        this.surface = null;
        this.api = null;
        this.preset = null;
        this.activePresetName = 'casual-toss';
        this.basePresetName = 'casual-toss';
        this.replayTimer = null;
        this.lastTrigger = null;
        this.lastSurfaceState = null;
        this.lastHelperPlanRevision = null;
        this.controlsBuilt = false;
        this.helperDrag = null;
        this.reducedMotion = this.prefersReducedMotion();
        this.controlDefinitions = [
            {group: 'path', field: 'path.directionDeg', label: 'Travel heading', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'path', field: 'path.distancePx', label: 'Travel distance', min: 0, max: 1000, step: 1, unit: 'px'},
            {group: 'path', field: 'path.curvePx', label: 'Path curve', min: -300, max: 300, step: 1, unit: 'px'},
            {group: 'path', field: 'path.landingXPx', label: 'Landing offset X', min: -300, max: 300, step: 1, unit: 'px'},
            {group: 'path', field: 'path.landingYPx', label: 'Landing offset Y', min: -220, max: 220, step: 1, unit: 'px'},
            {group: 'path', field: 'path.flightMs', label: 'Flight time', min: 200, max: 2500, step: 10, unit: 'ms'},

            {group: 'height', field: 'path.releaseHeight', label: 'Release height', min: 0, max: 300, step: 1, unit: 'z'},
            {group: 'height', field: 'path.apexHeight', label: 'Apex height', min: 0, max: 400, step: 1, unit: 'z'},
            {group: 'height', field: 'scale.cardScale', label: 'Card size', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},

            {group: 'keyframed-scale', field: 'scale.start', label: 'Release scale', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},
            {group: 'keyframed-scale', field: 'scale.apex', label: 'Apex scale', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},
            {group: 'keyframed-scale', field: 'scale.contact', label: 'Contact scale', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},
            {group: 'keyframed-scale', field: 'scale.end', label: 'Rest scale', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'},

            {group: 'rotation', field: 'rotation.xTurns', label: 'End-over-end', min: -3, max: 3, step: 0.25, unit: 'turn'},
            {group: 'rotation', field: 'rotation.yTurns', label: 'Side-over-side', min: -3, max: 3, step: 0.25, unit: 'turn'},
            {group: 'rotation', field: 'rotation.zTurns', label: 'Table spin', min: -2, max: 2, step: 0.01, unit: 'turn'},
            {group: 'rotation', field: 'rotation.releasePitchDeg', label: 'Release pitch', min: -75, max: 75, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.releaseYawDeg', label: 'Release yaw', min: -75, max: 75, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.releaseRollDeg', label: 'Release roll', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.contactPitchDeg', label: 'Contact pitch', min: -45, max: 45, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.contactYawDeg', label: 'Contact yaw', min: -45, max: 45, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.contactRollDeg', label: 'Contact roll', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'rotation', field: 'rotation.finalRollDeg', label: 'Final rotation', min: -30, max: 30, step: 1, unit: '\u00b0'},

            {group: 'landing', field: 'landing.skidDistancePx', label: 'Skid distance', min: 0, max: 200, step: 1, unit: 'px'},
            {group: 'landing', field: 'landing.skidAngleDeg', label: 'Skid direction', min: -180, max: 180, step: 1, unit: '\u00b0'},
            {group: 'landing', field: 'landing.slapMs', label: 'Slap time', min: 0, max: 400, step: 5, unit: 'ms'},
            {group: 'landing', field: 'landing.skidMs', label: 'Skid time', min: 0, max: 1000, step: 5, unit: 'ms'},
            {group: 'landing', field: 'shadow.strength', label: 'Shadow strength', min: 0, max: 1, step: 0.01, unit: ''},
            {group: 'landing', field: 'shadow.spread', label: 'Shadow spread', min: 0.5, max: 2, step: 0.01, unit: '\u00d7'}
        ];

        this.buildControls();
        this.bindUi();

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
            $row.append($label, $range, $number, $unit);
            $('[data-motion-control-group="' + definition.group + '"]')
                .append($row);
        });
    },

    bindUi: function() {
        var me = this;

        $('#motionstudio .motion-studio-back').click(function() {
            me.close();
        });
        $('#motionstudio .motion-studio-reset').click(function() {
            me.selectPreset(me.basePresetName);
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
        $('#motionstudio-actual-size').change(function() {
            $('#motionstudio-preview').toggleClass(
                'actual-size',
                this.checked
            );
            me.saveSessionPreset();
        });
        $('#motionstudio-auto-replay').change(function() {
            me.saveSessionPreset();
        });
        $('#motionstudio-preview').on(
            'pointerdown',
            '.motion-studio-marker-start, .motion-studio-marker-land',
            function(event) {
                me.beginHelperDrag(
                    this.classList &&
                    this.classList.contains('motion-studio-marker-start')
                        ? 'start'
                        : 'land',
                    event
                );
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

    open: function() {
        var me = this;
        var card;

        if (this.opened) {
            return;
        }
        this.opened = true;
        this.lastHelperPlanRevision = null;
        $('#motionstudio')
            .addClass('motion-studio-open')
            .attr('aria-hidden', 'false');
        $('#motionstudio .motion-studio-loading')
            .removeClass('ready')
            .text('Preparing Three.js preview\u2026');
        this.setControlStatus('', false);
        this.setJsonStatus('', false);
        $('body').addClass('motion-studio-active');
        card = this.getCard();
        if (!card) {
            this.showLoadError('A card is required to open the Motion Studio.');
            return;
        }

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
                me.surface.setPreset(me.preset);
                me.surface.setCard(card);
            }
        );
        window.setTimeout(function() {
            $('#motionstudio .motion-studio-back').focus();
        }, 0);
    },

    close: function() {
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

    loadInitialPreset: function() {
        var stored = null;
        var session = null;
        var ui = null;
        var selectedName;
        var baseName;
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
                            this.sessionVersion &&
                        session.preset) {
                    this.preset = this.api.normalizePreset(session.preset);
                    selectedName = session.activePresetName;
                    baseName = session.basePresetName;
                    this.activePresetName =
                        selectedName === 'custom' ||
                        this.api.presets[selectedName]
                            ? selectedName
                            : 'custom';
                    this.basePresetName = this.api.presets[baseName]
                        ? baseName
                        : 'casual-toss';
                    ui = session.ui || {};
                    if (typeof ui.autoReplay === 'boolean') {
                        $('#motionstudio-auto-replay')
                            .prop('checked', ui.autoReplay);
                    }
                    if (typeof ui.helpers === 'boolean') {
                        $('#motionstudio-show-helpers')
                            .prop('checked', ui.helpers);
                    }
                    if (typeof ui.actualSize === 'boolean') {
                        $('#motionstudio-actual-size')
                            .prop('checked', ui.actualSize);
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
                } else {
                    this.preset = this.api.parsePreset(stored);
                    this.activePresetName = 'custom';
                    this.basePresetName = 'casual-toss';
                }
            } catch (error) {
                this.preset = null;
            }
        }
        if (!this.preset) {
            this.preset = this.api.normalizePreset(
                this.api.presets['casual-toss']
            );
            this.activePresetName = 'casual-toss';
            this.basePresetName = 'casual-toss';
        }
        if (this.reducedMotion) {
            $('#motionstudio-auto-replay').prop('checked', false);
        }
        $('#motionstudio-preview')
            .toggleClass(
                'helpers-hidden',
                !$('#motionstudio-show-helpers').is(':checked')
            )
            .toggleClass(
                'actual-size',
                $('#motionstudio-actual-size').is(':checked')
            );
        this.syncUiFromPreset();
        this.updateRecipeJson();
    },

    selectPreset: function(name) {
        if (!this.api || !this.api.presets[name]) {
            return;
        }
        this.activePresetName = name;
        this.basePresetName = name;
        this.preset = this.api.normalizePreset(this.api.presets[name]);
        this.setControlStatus('', false);
        this.applyPresetToSurface(true);
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
        candidate = this.clonePreset(this.preset);
        this.setNestedValue(candidate, field, value);
        try {
            candidate = this.api.normalizePreset(candidate);
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
        if (!this.preset || !this.api) {
            return;
        }
        this.syncUiFromPreset();
        this.updateRecipeJson();
        this.saveSessionPreset();
        if (this.surface) {
            try {
                this.surface.setPreset(this.preset);
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

    syncUiFromPreset: function() {
        var me = this;
        if (!this.preset) {
            return;
        }
        $('#motionstudio-preset').val(
            this.activePresetName === 'custom'
                ? 'custom'
                : this.activePresetName
        );
        $('#motionstudio-scale-mode').val(this.preset.scale.mode);
        $('#motionstudio').toggleClass(
            'motion-studio-keyframed',
            this.preset.scale.mode === 'keyframed'
        );
        $('#motionstudio [data-motion-field]').each(function() {
            var field = $(this).attr('data-motion-field');
            if (field === 'scale.mode') {
                return;
            }
            $(this).val(me.getNestedValue(me.preset, field));
        });
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
        if (!this.preset || !this.lastSurfaceState ||
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
        var baseX;
        var baseY;
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
        baseX = destination.x - this.preset.path.landingXPx;
        baseY = destination.y - this.preset.path.landingYPx;
        if (this.helperDrag.name === 'land') {
            changes = {
                'path.landingXPx': Math.round(
                    Math.max(-300, Math.min(300, x - baseX))
                ),
                'path.landingYPx': Math.round(
                    Math.max(-220, Math.min(220, y - baseY))
                )
            };
        } else {
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
        }
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
            candidate = this.api.normalizePreset(candidate);
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
            this.updateHelpers(state.plan);
        }
    },

    updateHelpers: function(plan) {
        var sample;
        var points = [];
        var index;
        var total;
        var releaseAt;
        var flightDuration;
        var contactAt;
        var flatAt;

        if (!this.api || !plan) {
            return;
        }
        total = plan.timing.totalMs || 1;
        releaseAt = plan.timing.delayMs || 0;
        flightDuration = plan.timing.flightMs;
        contactAt = releaseAt + flightDuration;
        flatAt = contactAt + plan.timing.slapMs;
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
        this.placeTimelineMarker('release', releaseAt / total);
        this.placeTimelineMarker(
            'apex',
            (
                releaseAt +
                (flightDuration * plan.path.apexProgress)
            ) / total
        );
        this.placeTimelineMarker('contact', contactAt / total);
        this.placeTimelineMarker('flat', flatAt / total);
        this.placeTimelineMarker('settled', 1);
    },

    placeMarker: function(name, x, y) {
        $('.motion-studio-marker-' + name)
            .attr('transform', 'translate(' + x + ' ' + y + ')');
    },

    placeTimelineMarker: function(name, progress) {
        $('[data-motion-marker="' + name + '"]').css(
            'left',
            (Math.max(0, Math.min(1, progress)) * 100) + '%'
        );
    },

    updateRecipeJson: function() {
        if (this.api && this.preset) {
            $('#motionstudio-json').val(
                this.api.serializePreset(this.preset)
            );
        }
    },

    copyJson: function() {
        var me = this;
        var text = $('#motionstudio-json').val();
        var copied = function() {
            me.setJsonStatus('Copied the versioned recipe.', false);
        };
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
        if (!this.api) {
            return;
        }
        try {
            candidate = this.api.parsePreset(
                $('#motionstudio-json').val()
            );
            candidate = this.api.normalizePreset(candidate);
            this.preset = candidate;
            this.activePresetName = 'custom';
            this.applyPresetToSurface(true);
            this.setJsonStatus('Recipe applied.', false);
            this.setControlStatus('', false);
        } catch (error) {
            this.setJsonStatus(
                error && error.message
                    ? error.message
                    : 'The recipe is invalid.',
                true
            );
        }
    },

    saveSessionPreset: function() {
        var serializedPreset;
        var session;
        if (!this.api || !this.preset) {
            return;
        }
        try {
            serializedPreset = JSON.parse(
                this.api.serializePreset(this.preset)
            );
            session = {
                studioSessionVersion: this.sessionVersion,
                activePresetName: this.activePresetName,
                basePresetName: this.basePresetName,
                preset: serializedPreset,
                ui: {
                    autoReplay:
                        $('#motionstudio-auto-replay').is(':checked'),
                    helpers:
                        $('#motionstudio-show-helpers').is(':checked'),
                    actualSize:
                        $('#motionstudio-actual-size').is(':checked'),
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
