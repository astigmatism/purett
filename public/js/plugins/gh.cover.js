gh.cover = function(wrapper) {
    this.initialize(wrapper);
};
gh.cover.prototype = {
    
    canvas:     null,
    left:       null,
    right:      null,
    isopen:       false,
    graphics:   null,
    presentationSequence: 0,
    presentation: null,
    legacyCanvasVisibility: '',
    
    initialize: function(wrapper) {
        var me = this;
        this.graphics = null;
        this.presentationSequence = 0;
        this.legacyCanvasVisibility = '';
        this.presentation = this.buildPresentation(
            'closed',
            null,
            null,
            0
        );
        $(document).ready(function() {
            
            $(wrapper).append('<div id="game-cover" class="abs"></div>');
            
            me.canvas = Raphael("game-cover", 755, 562);
            if (me.canvas.canvas &&
                    me.canvas.canvas.setAttribute) {
                var legacyCanvasClass =
                    me.canvas.canvas.getAttribute('class') || '';
                me.canvas.canvas.setAttribute(
                    'id',
                    'legacyGameCover'
                );
                me.canvas.canvas.setAttribute(
                    'class',
                    (legacyCanvasClass
                        ? legacyCanvasClass + ' '
                        : '') +
                        'legacy-game-cover-canvas'
                );
                me.canvas.canvas.setAttribute(
                    'data-cover-renderer',
                    'legacy'
                );
                me.canvas.canvas.setAttribute(
                    'data-cover-renderer-active',
                    'true'
                );
                me.canvas.canvas.setAttribute(
                    'aria-hidden',
                    'false'
                );
                me.legacyCanvasVisibility =
                    me.canvas.canvas.style.visibility || '';
            }
            
            
            me.left = me.canvas.image('/images/left.png', 0, 0, 377, 562);
            me.right = me.canvas.image('/images/right.png', 376, 0, 378, 562);
            $('#game-cover').append(
                '<div id="modernGameCover" ' +
                    'data-cover-renderer="modern" ' +
                    'data-cover-renderer-active="false" ' +
                    'aria-hidden="true"></div>'
            );
            
        });
    },
    buildPresentation: function(target, easing, startedAtMs, sequence) {
        return {
            schemaVersion: 1,
            sequence: sequence,
            target: target,
            startedAtMs: startedAtMs,
            durationMs: startedAtMs === null ? 0 : 2000,
            easing: easing,
            frame: {
                x: 0,
                y: 0,
                width: 755,
                height: 562
            },
            panels: [
                {
                    id: 'left',
                    textureUrl: '/images/left.png',
                    rect: {
                        x: 0,
                        y: 0,
                        width: 377,
                        height: 562
                    },
                    hinge: 'left',
                    rotationSign: -1
                },
                {
                    id: 'right',
                    textureUrl: '/images/right.png',
                    rect: {
                        x: 376,
                        y: 0,
                        width: 378,
                        height: 562
                    },
                    hinge: 'right',
                    rotationSign: 1
                }
            ]
        };
    },
    clonePresentation: function(presentation) {
        return presentation == null
            ? null
            : JSON.parse(JSON.stringify(presentation));
    },
    describePresentation: function() {
        return this.clonePresentation(this.presentation);
    },
    setGraphicsCoordinator: function(graphics) {
        this.graphics = graphics || null;
        this.notifyGraphics();
    },
    setModernCoverReady: function(ready) {
        var modernReady = ready === true;
        var legacyCanvas =
            this.canvas && this.canvas.canvas;
        var modernHost =
            document.getElementById('modernGameCover');
        $('#game-cover').toggleClass(
            'graphics-modern-cover-ready',
            modernReady
        );
        if (legacyCanvas &&
                legacyCanvas.style) {
            legacyCanvas.style.visibility =
                modernReady
                    ? 'hidden'
                    : this.legacyCanvasVisibility;
            legacyCanvas.setAttribute(
                'aria-hidden',
                modernReady
                    ? 'true'
                    : 'false'
            );
            legacyCanvas.setAttribute(
                'data-cover-renderer-active',
                modernReady
                    ? 'false'
                    : 'true'
            );
        }
        if (modernHost) {
            modernHost.setAttribute(
                'data-cover-renderer-active',
                modernReady
                    ? 'true'
                    : 'false'
            );
        }
    },
    notifyGraphics: function() {
        if (this.graphics &&
                this.graphics.updateGameCover) {
            try {
                this.graphics.updateGameCover(
                    this.describePresentation()
                );
            } catch (error) {
                if (this.graphics.handleGameCoverFailure) {
                    try {
                        this.graphics.handleGameCoverFailure(
                            error,
                            'presentation-failed'
                        );
                    } catch (fallbackError) {
                        // Modern presentation cannot interrupt Legacy flow.
                    }
                }
            }
        }
    },
    notifyGraphicsSettlement: function(target, sequence) {
        if (this.graphics &&
                this.graphics.handleGameCoverSettlement) {
            try {
                this.graphics.handleGameCoverSettlement({
                    schemaVersion: 1,
                    sequence: sequence,
                    target: target,
                    completedAtMs:
                        window.performance &&
                        typeof window.performance.now ===
                            'function'
                            ? window.performance.now()
                            : new Date().getTime()
                });
            } catch (error) {
                // A decorative Modern reaction cannot interrupt Legacy flow.
            }
        }
    },
    publishTarget: function(target, easing) {
        this.presentationSequence += 1;
        this.presentation = this.buildPresentation(
            target,
            easing,
            window.performance &&
                typeof window.performance.now === 'function'
                ? window.performance.now()
                : new Date().getTime(),
            this.presentationSequence
        );
        this.notifyGraphics();
    },
    open: function(callback) {
        var me = this;
        if (!me.isopen) {
            me.isopen = true;
            var rotation = (Math.random() * 60) - 30;
            me.publishTarget('open', 'cubic-in');
            var openingSequence =
                me.presentationSequence;
            me.left.animate({ translation: [-450, 0], rotation: rotation}, 2000, '<', function() {
                $('#game-cover').hide();
                if (me.isopen &&
                        me.presentationSequence ===
                            openingSequence &&
                        me.presentation &&
                        me.presentation.target ===
                            'open') {
                    me.notifyGraphicsSettlement(
                        'open',
                        openingSequence
                    );
                }
            });
            me.right.animate({ translation: [450, 0], rotation: Math.abs(rotation)}, 2000, '<', function() {
            });
            
            if (gh.defined(callback, 'function')) {
                callback();
            }
        } else {
            if (gh.defined(callback, 'function')) {
                callback();
            }
        }
    },
    close: function(callback) {
        var me = this;
        if (me.isopen) {
            me.isopen = false;
            $('#game-cover').show();
            me.left.stop();
            me.publishTarget('closed', 'cubic-out');
            me.left.animate({ translation: [Math.abs(me.left.attr('x')), 0], rotation: 0 }, 2000, '>', function() {
                if (gh.defined(callback, 'function')) {
                    callback();
                }
            });
            me.right.stop();
            me.right.animate({ translation: [(me.right.attr('x') * -1) + 376, 0], rotation: 0 }, 2000, '>', function() {
            });
        } else {
            if (gh.defined(callback, 'function')) {
                callback();
            }
        }
    }
};
