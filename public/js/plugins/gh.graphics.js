gh.graphics = function(options) {
    this.initialize(options || {});
};
gh.graphics.prototype = {
    initialize: function(options) {
        var me = this;

        this.game = options.game;
        this.modernEnabled = options.modernEnabled !== false;
        this.getContentScale = options.getContentScale || function() { return 1; };
        this.closeMenu = options.closeMenu || function() {};
        this.storageKey = 'purett.graphicsMode.v1';
        this.threePackageVersion = '0.185.1';
        this.threeRevision = '185';
        this.modernScriptUrl = '/js/modern/purett-modern-graphics.min.js?v=0.185.1';
        this.requestedMode = 'legacy';
        this.effectiveMode = 'legacy';
        this.loadState = 'idle';
        this.loadError = null;
        this.loadCallbacks = [];
        this.fallbackReason = null;
        this.surface = null;
        this.scriptElement = null;

        var storedMode = null;
        try {
            storedMode = window.localStorage.getItem(this.storageKey);
        } catch (error) {
            storedMode = null;
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
            String(modernGraphics.revision) === this.threeRevision;
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
        var me = this;
        var host = document.getElementById('modernGraphics');

        try {
            if (this.surface && this.surface.getDebugState().contextLost) {
                this.surface.dispose();
                this.surface = null;
            }
            if (!this.surface) {
                this.surface = modernGraphics.createSurface(host, {
                    contentScale: this.getContentScale(),
                    onContextLost: function(error) {
                        me.activateLegacy(error);
                    }
                });
            } else {
                this.surface.setContentScale(this.getContentScale());
            }
        } catch (error) {
            if (this.surface) {
                try {
                    this.surface.dispose();
                } catch (cleanupError) {
                    // Preserve the graphics initialization error for the UI.
                }
            }
            this.surface = null;
            $('#modernGraphics canvas.modern-graphics-canvas').remove();
            this.activateLegacy(error);
            return;
        }

        this.game.setGraphicsMode('modern');
        this.effectiveMode = 'modern';
        this.fallbackReason = null;
        this.updateModeUi();
        this.updateBoardState();
        this.setStatus('Three.js ' + this.threePackageVersion + ' preview active. Cards are not rendered yet; select Legacy to play.');
    },
    activateLegacy: function(error, reason) {
        this.game.setGraphicsMode('legacy');
        this.effectiveMode = 'legacy';
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
    setContentScale: function(scale) {
        if (this.surface) {
            this.surface.setContentScale(scale);
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
            surface: this.surface ? this.surface.getDebugState() : null
        };
    }
};
