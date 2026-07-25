gh.graphics = function(options) {
    this.initialize(options || {});
};
gh.graphics.prototype = {
    initialize: function(options) {
        var me = this;

        this.game = options.game;
        this.menu = options.menu;
        this.modernEnabled = options.modernEnabled !== false;
        this.getContentScale = options.getContentScale || function() { return 1; };
        this.closeMenu = options.closeMenu || function() {};
        this.storageKey = 'purett.graphicsMode.v1';
        this.playbookStorageKey =
            'purett.lobbyMotionPlaybook.v1';
        this.threePackageVersion = '0.185.1';
        this.threeRevision = '185';
        this.modernScriptUrl = '/js/modern/purett-modern-graphics.min.js?v=0.185.1-lobby-playbook.1';
        this.requestedMode = 'legacy';
        this.effectiveMode = 'legacy';
        this.loadState = 'idle';
        this.loadError = null;
        this.loadCallbacks = [];
        this.fallbackReason = null;
        this.surface = null;
        this.surfaceKind = null;
        this.surfaceDisposing = false;
        this.studioSurface = null;
        this.studioOpen = false;
        this.studioGeneration = 0;
        this.modernGraphics = null;
        this.lobbyVisible = false;
        this.lobbyCards = [];
        this.lobbyPresentation = null;
        this.lobbyPresentationDeliveredId = null;
        this.scriptElement = null;
        this.lobbyPlaybookSource = null;
        this.lobbyPlaybook = null;
        this.playbookRevision = 0;
        this.windSequence = 0;
        this.lobbyCommandSequence = 0;
        this.pendingLobbyCommand = null;
        this.lobbyCommandWatchdog = null;
        this.previewSequence = 0;
        this.previewRestoreMode = null;
        this.previewWatchdog = null;
        this.activePreviewFinish = null;
        this.previewAllowStudioRestore = true;

        var storedMode = null;
        var storedPlaybook = null;
        try {
            storedMode = window.localStorage.getItem(this.storageKey);
            storedPlaybook = window.localStorage.getItem(
                this.playbookStorageKey
            );
        } catch (error) {
            storedMode = null;
            storedPlaybook = null;
        }
        if (storedPlaybook) {
            try {
                this.lobbyPlaybookSource = JSON.parse(storedPlaybook);
            } catch (error) {
                this.lobbyPlaybookSource = null;
            }
        }

        $('#contextmenu .graphics-mode-options button').click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (!$(this).closest('li').hasClass('enabled')) {
                return;
            }
            gh.audio.select.play();
            me.setMode($(this).attr('data-graphics-mode'), true);
            me.closeMenu();
        });

        $(window).resize(function() {
            me.setContentScale(me.getContentScale());
        });

        if (this.menu && this.menu.setGraphicsCoordinator) {
            this.menu.setGraphicsCoordinator(this);
        }

        this.setMode(storedMode, false);
    },
    isValidMode: function(mode) {
        return mode === 'legacy' || mode === 'modern';
    },
    setMode: function(mode, persist) {
        var me = this;

        if (!this.isValidMode(mode)) {
            mode = 'legacy';
        }

        this.requestedMode = mode;
        if (persist && this.previewRestoreMode !== null) {
            this.previewRestoreMode = mode;
            this.previewAllowStudioRestore = false;
        }
        this.updateModeUi();
        this.updateBoardState();

        if (persist) {
            try {
                window.localStorage.setItem(this.storageKey, mode);
            } catch (error) {
                // Storage can be unavailable in hardened/private contexts.
            }
        }

        if (mode === 'legacy') {
            this.activateLegacy();
            return;
        }

        if (!this.modernEnabled) {
            this.activateLegacy(null, 'configuration-disabled');
            return;
        }

        this.fallbackReason = 'loading';
        this.updateModeUi();
        this.updateBoardState();
        this.setStatus('Loading Three.js ' + this.threePackageVersion + '\u2026');
        this.loadModernGraphics(function(error, modernGraphics) {
            if (me.requestedMode !== 'modern') {
                return;
            }
            if (!me.modernEnabled) {
                me.activateLegacy(null, 'configuration-disabled');
                return;
            }
            if (error) {
                me.activateLegacy(error);
                return;
            }
            me.activateModern(modernGraphics);
        });
    },
    loadModernGraphics: function(callback) {
        var me = this;

        if (gh.modernGraphics) {
            if (!this.isExpectedModernGraphics(gh.modernGraphics)) {
                this.loadState = 'failed';
                callback(new Error('The loaded Three.js version does not match the application build.'));
                return;
            }
            this.loadState = 'loaded';
            callback(null, gh.modernGraphics);
            return;
        }

        if (this.loadState === 'failed') {
            this.loadState = 'idle';
            this.loadError = null;
            if (this.scriptElement && this.scriptElement.parentNode) {
                this.scriptElement.parentNode.removeChild(this.scriptElement);
            }
            this.scriptElement = null;
        }

        this.loadCallbacks.push(callback);
        if (this.loadState === 'loading') {
            return;
        }

        this.loadState = 'loading';
        this.scriptElement = document.createElement('script');
        this.scriptElement.id = 'purett-modern-graphics-script';
        this.scriptElement.async = true;
        this.scriptElement.src = this.modernScriptUrl;
        this.scriptElement.onload = function() {
            if (!gh.modernGraphics) {
                me.completeModernLoad(new Error('The Three.js bundle loaded without registering its graphics facade.'));
                return;
            }
            if (!me.isExpectedModernGraphics(gh.modernGraphics)) {
                me.completeModernLoad(new Error('The loaded Three.js version does not match the application build.'));
                return;
            }
            me.completeModernLoad(null, gh.modernGraphics);
        };
        this.scriptElement.onerror = function() {
            me.completeModernLoad(new Error('The Three.js bundle could not be loaded.'));
        };
        document.head.appendChild(this.scriptElement);
    },
    isExpectedModernGraphics: function(modernGraphics) {
        return modernGraphics &&
            modernGraphics.packageVersion === this.threePackageVersion &&
            String(modernGraphics.revision) === this.threeRevision &&
            typeof modernGraphics.createSurface === 'function' &&
            typeof modernGraphics.createLobbyHandSurface === 'function' &&
            typeof modernGraphics.createMotionStudioSurface === 'function' &&
            modernGraphics.motionStudio &&
            modernGraphics.lobbyPlaybook;
    },
    completeModernLoad: function(error, modernGraphics) {
        var callbacks = this.loadCallbacks.slice(0);
        this.loadCallbacks = [];
        this.loadError = error || null;
        this.loadState = error ? 'failed' : 'loaded';

        $.each(callbacks, function(index, queuedCallback) {
            queuedCallback(error || null, modernGraphics || null);
        });
    },
    activateModern: function(modernGraphics) {
        try {
            if (this.surface && this.surface.getDebugState().contextLost) {
                this.surface.dispose();
                this.surface = null;
                this.surfaceKind = null;
            }
            this.modernGraphics = modernGraphics;
            this.ensureLobbyPlaybook(modernGraphics);
            if (!this.studioOpen) {
                this.ensureSurface(
                    this.lobbyVisible ? 'lobby-hand' : 'active-match'
                );
            }
        } catch (error) {
            this.disposeSurface();
            $('#modernGraphics canvas.modern-graphics-canvas, #modernLobbyHand canvas.modern-graphics-canvas').remove();
            this.activateLegacy(error);
            return;
        }

        this.game.setGraphicsMode('modern');
        if (this.menu && this.menu.setGraphicsMode) {
            this.menu.setGraphicsMode('modern');
        }
        this.effectiveMode = 'modern';
        this.fallbackReason = null;
        if (!this.studioOpen) {
            try {
                this.renderCurrentSurface();
            } catch (error) {
                this.disposeSurface();
                this.activateLegacy(error);
                return;
            }
        }
        if (this.effectiveMode !== 'modern') {
            return;
        }
        this.updateModeUi();
        this.updateBoardState();
        this.updateModernStatus();
    },
    activateLegacy: function(error, reason) {
        this.effectiveMode = 'legacy';
        this.game.setGraphicsMode('legacy');
        if (this.menu && this.menu.setGraphicsMode) {
            this.menu.setGraphicsMode('legacy');
        }
        if (this.surfaceKind === 'lobby-hand' &&
            this.surface &&
            typeof this.surface.suspend === 'function') {
            this.surface.suspend();
        }
        this.finishPendingLobbyCommand(null, {
            outcome: 'graphics-fallback',
            error: error || null
        });
        this.fallbackReason = reason || (error ? 'initialization-failed' : null);
        this.updateModeUi();
        this.updateBoardState();

        if (this.fallbackReason === 'configuration-disabled') {
            this.setStatus('Modern graphics are disabled by configuration; Legacy is active.');
        } else if (this.requestedMode === 'modern' && error) {
            this.setStatus('Modern graphics unavailable; Legacy is active. ' + this.errorMessage(error));
        } else {
            this.setStatus('Legacy Raphael graphics active.');
        }
    },
    setModernEnabled: function(enabled) {
        this.modernEnabled = enabled !== false;
        if (!this.modernEnabled && this.requestedMode === 'modern') {
            this.activateLegacy(null, 'configuration-disabled');
        } else if (this.modernEnabled && this.requestedMode === 'modern') {
            this.setMode('modern', false);
        } else {
            this.updateModeUi();
            this.updateBoardState();
        }
    },
    errorMessage: function(error) {
        if (error && error.message) {
            return error.message;
        }
        return 'Unknown graphics initialization error.';
    },
    clonePlain: function(value) {
        return value == null
            ? value
            : JSON.parse(JSON.stringify(value));
    },
    ensureLobbyPlaybook: function(modernGraphics) {
        var api = modernGraphics && modernGraphics.lobbyPlaybook;
        if (!api) {
            throw new Error(
                'The lobby motion playbook API is unavailable.'
            );
        }
        try {
            this.lobbyPlaybook = api.normalize(
                this.lobbyPlaybookSource || api.defaults
            );
        } catch (error) {
            this.lobbyPlaybook = api.normalize(api.defaults);
        }
        this.lobbyPlaybookSource = this.clonePlain(
            this.lobbyPlaybook
        );
        return this.lobbyPlaybook;
    },
    getLobbyPlaybook: function() {
        if (this.modernGraphics &&
                this.modernGraphics.lobbyPlaybook) {
            this.ensureLobbyPlaybook(this.modernGraphics);
        }
        return this.clonePlain(
            this.lobbyPlaybook ||
            this.lobbyPlaybookSource
        );
    },
    setLobbyPlaybook: function(playbook, persist) {
        var api;
        if (!this.modernGraphics ||
                !this.modernGraphics.lobbyPlaybook) {
            throw new Error(
                'Three.js must be loaded before saving a lobby playbook.'
            );
        }
        api = this.modernGraphics.lobbyPlaybook;
        this.lobbyPlaybook = api.normalize(playbook);
        this.lobbyPlaybookSource = this.clonePlain(
            this.lobbyPlaybook
        );
        this.playbookRevision += 1;
        if (persist !== false) {
            try {
                window.localStorage.setItem(
                    this.playbookStorageKey,
                    api.serialize(this.lobbyPlaybook)
                );
            } catch (error) {
                // The authoring surface remains usable without storage.
            }
        }
        if (this.surfaceKind === 'lobby-hand' &&
                this.surface &&
                typeof this.surface.setPlaybook === 'function') {
            this.surface.setPlaybook(this.lobbyPlaybook);
        }
        return this.clonePlain(this.lobbyPlaybook);
    },
    resetLobbyPlaybook: function() {
        if (!this.modernGraphics ||
                !this.modernGraphics.lobbyPlaybook) {
            throw new Error(
                'Three.js must be loaded before resetting the playbook.'
            );
        }
        return this.setLobbyPlaybook(
            this.modernGraphics.lobbyPlaybook.defaults,
            true
        );
    },
    getLobbyCards: function() {
        return this.lobbyCards.map(function(card) {
            return $.extend({}, card);
        });
    },
    nextWindSeed: function(prefix) {
        this.windSequence += 1;
        return String(prefix || 'gentle-wind') + '-' +
            String(new Date().getTime()) + '-' +
            String(this.windSequence);
    },
    setContentScale: function(scale) {
        if (this.surface) {
            this.surface.setContentScale(scale);
        }
        if (this.studioSurface) {
            this.studioSurface.setContentScale(scale);
        }
    },
    showLobbyHand: function(cards, presentation) {
        this.lobbyVisible = true;
        this.lobbyCards = (cards || []).slice(0);
        this.lobbyPresentation = presentation ? {
            id: presentation.id,
            trigger: presentation.trigger || 'command-bar-reveal',
            sequence: presentation.sequence || 'intro',
            seed: presentation.seed,
            startedAtMs: presentation.startedAtMs == null
                ? null
                : Number(presentation.startedAtMs)
        } : null;
        if (this.menu && this.menu.setModernHandReady) {
            this.menu.setModernHandReady(false);
        }
        if (!this.studioOpen &&
            this.effectiveMode === 'modern' &&
            this.modernGraphics) {
            try {
                this.ensureSurface('lobby-hand');
                this.renderCurrentSurface();
                this.updateModernStatus();
            } catch (error) {
                this.disposeSurface();
                this.activateLegacy(error);
            }
        }
    },
    hideLobbyHand: function() {
        this.lobbyVisible = false;
        this.lobbyCards = [];
        this.lobbyPresentation = null;
        this.cancelLobbyPreview('cancelled-view-change');
        if (!this.studioOpen &&
            this.effectiveMode === 'modern' &&
            this.modernGraphics) {
            try {
                this.ensureSurface('active-match');
                this.renderCurrentSurface();
                this.updateModernStatus();
            } catch (error) {
                this.disposeSurface();
                this.activateLegacy(error);
            }
        }
    },
    ensureSurface: function(kind) {
        var me = this;
        var modernGraphics = this.modernGraphics;
        var host;
        var createdSurface;

        if (this.surfaceDisposing) {
            return;
        }
        if (!modernGraphics) {
            throw new Error('The modern graphics facade is unavailable.');
        }
        if (this.surface && this.surfaceKind === kind) {
            this.surface.setContentScale(this.getContentScale());
            return;
        }

        this.disposeSurface();
        if (kind === 'lobby-hand') {
            host = document.getElementById('modernLobbyHand');
            createdSurface = modernGraphics.createLobbyHandSurface(host, {
                contentScale: this.getContentScale(),
                onReady: function() {
                    if (me.surface === createdSurface &&
                        me.surfaceKind === 'lobby-hand' &&
                        me.lobbyVisible &&
                        me.effectiveMode === 'modern' &&
                        me.menu &&
                        me.menu.setModernHandReady) {
                        me.menu.setModernHandReady(true);
                        me.updateModernStatus();
                    }
                },
                onError: function(error) {
                    if (me.surface === createdSurface &&
                        me.surfaceKind === 'lobby-hand' &&
                        me.lobbyVisible &&
                        me.effectiveMode === 'modern') {
                        me.disposeSurface();
                        me.activateLegacy(error);
                    }
                },
                onContextLost: function(error) {
                    if (me.surface === createdSurface && me.effectiveMode === 'modern') {
                        me.disposeSurface();
                        me.activateLegacy(error);
                    }
                }
            });
        } else {
            host = document.getElementById('modernGraphics');
            createdSurface = modernGraphics.createSurface(host, {
                contentScale: this.getContentScale(),
                onContextLost: function(error) {
                    if (me.surface === createdSurface && me.effectiveMode === 'modern') {
                        me.activateLegacy(error);
                    }
                }
            });
        }

        this.surface = createdSurface;
        this.surfaceKind = kind;
    },
    renderCurrentSurface: function() {
        var playbookRequest = null;

        if (this.studioOpen || !this.surface) {
            return;
        }
        this.surface.setContentScale(this.getContentScale());
        if (this.surfaceKind === 'lobby-hand') {
            if (typeof this.surface.resume === 'function') {
                this.surface.resume();
            }
            if (this.lobbyPresentation &&
                this.lobbyPresentationDeliveredId !==
                    String(this.lobbyPresentation.id)) {
                playbookRequest = this.lobbyPresentation;
            }
            this.surface.setCards(this.lobbyCards, {
                playbook: this.lobbyPlaybook,
                playbookRequest: playbookRequest
            });
            if (playbookRequest) {
                this.lobbyPresentationDeliveredId =
                    String(playbookRequest.id);
            }
        } else {
            this.surface.render();
        }
    },
    disposeSurface: function() {
        var surface = this.surface;
        this.surface = null;
        this.surfaceKind = null;
        if (surface) {
            this.surfaceDisposing = true;
            try {
                surface.dispose();
            } catch (cleanupError) {
                // A failed cleanup must not prevent the intact Legacy path.
            } finally {
                this.surfaceDisposing = false;
            }
        }
    },
    openMotionStudio: function(host, options, callback) {
        var me = this;
        var generation;

        callback = callback || function() {};
        this.cancelLobbyPreview('cancelled-studio-reopened');
        if (!host) {
            callback(new Error('The Motion Studio preview host is unavailable.'));
            return;
        }
        if (!this.modernEnabled) {
            callback(new Error(
                'Modern graphics are disabled by configuration.'
            ));
            return;
        }

        this.studioGeneration += 1;
        generation = this.studioGeneration;
        this.studioOpen = true;
        this.disposeMotionStudioSurface();
        if (this.surfaceKind === 'lobby-hand' &&
                this.surface &&
                typeof this.surface.suspend === 'function') {
            this.surface.suspend();
        }

        this.loadModernGraphics(function(error, modernGraphics) {
            var createdSurface;
            if (!me.studioOpen || generation !== me.studioGeneration) {
                return;
            }
            if (error) {
                callback(error);
                return;
            }
            try {
                me.modernGraphics = modernGraphics;
                me.ensureLobbyPlaybook(modernGraphics);
                createdSurface = modernGraphics.createMotionStudioSurface(
                    host,
                    $.extend({}, options || {}, {
                        contentScale: me.getContentScale()
                    })
                );
                me.studioSurface = createdSurface;
            } catch (surfaceError) {
                me.disposeMotionStudioSurface();
                callback(surfaceError);
                return;
            }
            callback(
                null,
                createdSurface,
                modernGraphics.motionStudio
            );
        });
    },
    closeMotionStudio: function() {
        this.studioGeneration += 1;
        this.studioOpen = false;
        this.disposeMotionStudioSurface();

        if (this.effectiveMode === 'modern' &&
            this.modernGraphics &&
            this.surface) {
            try {
                this.surface.setContentScale(this.getContentScale());
                this.renderCurrentSurface();
                this.updateModernStatus();
            } catch (error) {
                this.disposeSurface();
                this.activateLegacy(error);
            }
        }
    },
    playLobbySequence: function(sequence, options, callback) {
        var me = this;
        var settings = options || {};
        var completed = false;
        var complete = function(result) {
            if (completed) {
                return;
            }
            completed = true;
            if (gh.defined(callback, 'function')) {
                callback(result || {
                    outcome: 'completed',
                    sequence: sequence
                });
            }
        };
        var seed;
        var request;

        if (this.effectiveMode !== 'modern' ||
                this.surfaceKind !== 'lobby-hand' ||
                !this.surface ||
                !this.lobbyVisible ||
                typeof this.surface.playPlaybookSequence !== 'function') {
            complete({
                outcome: 'unavailable',
                sequence: sequence
            });
            return false;
        }
        try {
            this.ensureLobbyPlaybook(this.modernGraphics);
            if (settings.seed != null) {
                seed = String(settings.seed);
            } else if (sequence === 'exit' &&
                    this.lobbyPlaybook.wind.locked) {
                seed = this.lobbyPlaybook.wind.seed;
            } else {
                seed = this.nextWindSeed(
                    sequence === 'exit'
                        ? 'gentle-wind'
                        : 'lobby-intro'
                );
            }
            request = {
                id: settings.id || (
                    sequence + '-' + seed
                ),
                trigger: settings.trigger || (
                    sequence === 'exit'
                        ? 'lobby-command'
                        : 'playbook-preview'
                ),
                seed: seed
            };
            this.surface.playPlaybookSequence(
                sequence,
                this.lobbyPlaybook,
                request,
                function(result) {
                    complete(result);
                    me.updateModernStatus();
                }
            );
            this.updateModernStatus();
            return true;
        } catch (error) {
            complete({
                outcome: 'failed',
                sequence: sequence,
                error: error
            });
            return false;
        }
    },
    finishPendingLobbyCommand: function(token, result) {
        var pending = this.pendingLobbyCommand;
        if (!pending ||
                (token !== null && token !== undefined &&
                    pending.token !== token)) {
            return false;
        }
        this.pendingLobbyCommand = null;
        if (this.lobbyCommandWatchdog !== null) {
            window.clearTimeout(this.lobbyCommandWatchdog);
            this.lobbyCommandWatchdog = null;
        }
        pending.continuation(result || {
            outcome: 'completed',
            sequence: 'exit'
        });
        return true;
    },
    beforeLobbyCommand: function(command, continuation) {
        var me = this;
        var token;
        var seed;
        var surfaceState;
        var deadlineMs;
        var finish;

        if (this.pendingLobbyCommand) {
            return false;
        }
        this.cancelLobbyPreview('cancelled-lobby-command');
        if (this.effectiveMode !== 'modern' ||
                this.surfaceKind !== 'lobby-hand' ||
                !this.surface ||
                !this.lobbyVisible) {
            continuation({
                outcome: 'unavailable',
                sequence: 'exit'
            });
            return true;
        }
        this.ensureLobbyPlaybook(this.modernGraphics);
        seed = this.lobbyPlaybook.wind.locked
            ? this.lobbyPlaybook.wind.seed
            : this.nextWindSeed('gentle-wind');
        token = ++this.lobbyCommandSequence;
        this.pendingLobbyCommand = {
            token: token,
            command: command,
            seed: seed,
            startedAtMs: window.performance.now(),
            continuation: continuation
        };
        finish = function(result) {
            me.finishPendingLobbyCommand(token, result);
        };
        this.playLobbySequence(
            'exit',
            {
                id: 'command-' + command + '-' + seed,
                trigger: 'lobby-command-' + command,
                seed: seed
            },
            finish
        );
        if (this.pendingLobbyCommand &&
                this.pendingLobbyCommand.token === token) {
            surfaceState = this.surface &&
                this.surface.getDebugState
                    ? this.surface.getDebugState()
                    : null;
            deadlineMs = surfaceState &&
                surfaceState.lastPlaybookBatch
                    ? Number(
                        surfaceState.lastPlaybookBatch.deadlineMs
                    )
                    : 0;
            deadlineMs = Math.min(
                15000,
                Math.max(4500, deadlineMs + 1000)
            );
            this.lobbyCommandWatchdog = window.setTimeout(
                function() {
                    finish({
                        outcome: 'watchdog-timeout',
                        sequence: 'exit'
                    });
                },
                deadlineMs
            );
        }
        return true;
    },
    waitForModernLobby: function(callback, timeoutMs) {
        var me = this;
        var started = new Date().getTime();
        var timeout = Number(timeoutMs) || 4000;
        var check = function() {
            var state;
            if (me.effectiveMode === 'modern' &&
                    me.surfaceKind === 'lobby-hand' &&
                    me.surface) {
                state = me.surface.getDebugState();
                if (state && state.ready) {
                    callback(null);
                    return;
                }
            }
            if (new Date().getTime() - started >= timeout) {
                callback(new Error(
                    'The Modern lobby preview did not become ready.'
                ));
                return;
            }
            window.setTimeout(check, 50);
        };
        check();
    },
    previewLobbyPlaybook: function(sequence, options, callback) {
        var me = this;
        var token;
        this.cancelLobbyPreview('superseded-preview');
        token = ++this.previewSequence;
        var originalRequestedMode =
            this.previewRestoreMode || this.requestedMode;
        var settings = options || {};
        var finished = false;
        this.previewRestoreMode = originalRequestedMode;
        this.previewAllowStudioRestore = true;
        if (this.previewWatchdog !== null) {
            window.clearTimeout(this.previewWatchdog);
            this.previewWatchdog = null;
        }
        var finish = function(result) {
            var restoreMode;
            if (finished || token !== me.previewSequence) {
                return;
            }
            finished = true;
            if (me.previewWatchdog !== null) {
                window.clearTimeout(me.previewWatchdog);
                me.previewWatchdog = null;
            }
            restoreMode =
                me.previewRestoreMode || originalRequestedMode;
            me.previewRestoreMode = null;
            if (me.activePreviewFinish === finish) {
                me.activePreviewFinish = null;
            }
            if (me.requestedMode !== restoreMode) {
                me.setMode(restoreMode, false);
            }
            if (gh.defined(callback, 'function')) {
                callback(result);
            }
            me.previewAllowStudioRestore = true;
        };
        this.activePreviewFinish = finish;
        var run = function() {
            if (token !== me.previewSequence) {
                return;
            }
            me.playLobbySequence(
                sequence,
                {
                    id: 'studio-preview-' + token,
                    trigger: 'motion-studio-preview',
                    seed: settings.seed
                },
                function(result) {
                    var holdMs =
                        sequence === 'exit' ? 750 : 500;
                    window.setTimeout(function() {
                        if (token !== me.previewSequence) {
                            return;
                        }
                        if (me.surfaceKind === 'lobby-hand' &&
                                me.surface &&
                                typeof me.surface
                                    .resetPlaybookCards ===
                                        'function') {
                            me.surface.resetPlaybookCards();
                        }
                        finish(result);
                    }, holdMs);
                }
            );
        };
        this.previewWatchdog = window.setTimeout(
            function() {
                finish({
                    outcome: 'watchdog-timeout',
                    sequence: sequence
                });
            },
            20000
        );

        if (!this.lobbyVisible) {
            finish({
                outcome: 'unavailable',
                sequence: sequence
            });
            return;
        }
        if (this.effectiveMode === 'modern' &&
                this.surfaceKind === 'lobby-hand' &&
                this.surface) {
            run();
            return;
        }
        this.setMode('modern', false);
        this.waitForModernLobby(function(error) {
            if (error) {
                finish({
                    outcome: 'failed',
                    sequence: sequence,
                    error: error
                });
                return;
            }
            run();
        });
    },
    cancelLobbyPreview: function(outcome) {
        var finish = this.activePreviewFinish;
        if (!finish) {
            return false;
        }
        this.previewAllowStudioRestore = false;
        finish({
            outcome: outcome || 'cancelled',
            sequence: null
        });
        this.previewSequence += 1;
        return true;
    },
    canRestoreMotionStudioPreview: function() {
        var $mainMenu = $('#content ul.mainmenu');
        var mainMenuReady =
            $mainMenu.length === 0 ||
            $mainMenu.find('li.play').length > 0;
        return this.previewAllowStudioRestore !== false &&
            this.lobbyVisible &&
            (!this.menu || this.menu.visible !== false) &&
            (!this.menu || this.menu.commandPending !== true) &&
            mainMenuReady;
    },
    replayLobbyIntro: function(callback) {
        var seed = this.nextWindSeed('reentry');
        return this.playLobbySequence(
            'intro',
            {
                id: 'lobby-intro-' + seed,
                trigger: 'lobby-reentry',
                seed: seed
            },
            callback
        );
    },
    disposeMotionStudioSurface: function() {
        if (this.studioSurface) {
            try {
                this.studioSurface.dispose();
            } catch (cleanupError) {
                // Studio cleanup must not disrupt the application surface.
            }
        }
        this.studioSurface = null;
    },
    updateModernStatus: function() {
        var surfaceState;

        if (this.effectiveMode !== 'modern') {
            return;
        }
        if (!this.lobbyVisible) {
            this.setStatus('Three.js ' + this.threePackageVersion + ' match preview active. Match cards are not rendered yet; select Legacy to play.');
            return;
        }

        surfaceState = this.surface ? this.surface.getDebugState() : null;
        if (surfaceState && surfaceState.ready) {
            this.setStatus('Three.js ' + this.threePackageVersion + ' lobby hand active. Click a card to flip it; matches still require Legacy.');
        } else {
            this.setStatus('Three.js ' + this.threePackageVersion + ' is preparing the Modern lobby hand\u2026');
        }
    },
    updateModeUi: function() {
        var me = this;
        $('#contextmenu .graphics-mode-options button').each(function() {
            var selected = $(this).attr('data-graphics-mode') === me.requestedMode;
            $(this).attr('aria-pressed', selected ? 'true' : 'false');
        });
        $('#contextmenu li.graphics-mode')
            .attr('data-requested-mode', this.requestedMode)
            .attr('data-effective-mode', this.effectiveMode)
            .attr('data-modern-enabled', this.modernEnabled ? 'true' : 'false');
    },
    updateBoardState: function() {
        var $board = $('#board');
        $board
            .attr('data-graphics-requested', this.requestedMode)
            .attr('data-graphics-effective', this.effectiveMode);

        if (gh.modernGraphics) {
            $board
                .attr('data-three-package-version', gh.modernGraphics.packageVersion)
                .attr('data-three-revision', gh.modernGraphics.revision);
        }
        if (this.fallbackReason) {
            $board.attr('data-graphics-fallback-reason', this.fallbackReason);
        } else {
            $board.removeAttr('data-graphics-fallback-reason');
        }
    },
    setStatus: function(message) {
        $('#contextmenu .graphics-mode-status').text(message);
        $('#modernGraphics .modern-graphics-detail').text(message);
    },
    getState: function() {
        return {
            requestedMode: this.requestedMode,
            effectiveMode: this.effectiveMode,
            modernEnabled: this.modernEnabled,
            fallbackReason: this.fallbackReason,
            loadState: this.loadState,
            packageVersion: gh.modernGraphics ? gh.modernGraphics.packageVersion : null,
            revision: gh.modernGraphics ? String(gh.modernGraphics.revision) : null,
            surfaceKind: this.surfaceKind,
            lobbyVisible: this.lobbyVisible,
            lobbyPresentation: this.lobbyPresentation
                ? $.extend({}, this.lobbyPresentation)
                : null,
            lobbyPresentationDeliveredId:
                this.lobbyPresentationDeliveredId,
            playbookRevision: this.playbookRevision,
            lobbyPlaybook: this.lobbyPlaybook
                ? this.clonePlain(this.lobbyPlaybook)
                : null,
            pendingLobbyCommand: this.pendingLobbyCommand
                ? {
                    token: this.pendingLobbyCommand.token,
                    command: this.pendingLobbyCommand.command,
                    seed: this.pendingLobbyCommand.seed,
                    startedAtMs:
                        this.pendingLobbyCommand.startedAtMs
                }
                : null,
            lobbyPreview: this.activePreviewFinish
                ? {
                    restoreMode: this.previewRestoreMode,
                    allowStudioRestore:
                        this.previewAllowStudioRestore
                }
                : null,
            surface: this.surface ? this.surface.getDebugState() : null,
            motionStudioOpen: this.studioOpen,
            motionStudio: this.studioSurface
                ? this.studioSurface.getDebugState()
                : null
        };
    }
};
