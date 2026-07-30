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
    
    initialize: function(wrapper) {
        var me = this;
        this.graphics = null;
        this.presentationSequence = 0;
        this.presentation = this.buildPresentation(
            'closed',
            null,
            null,
            0
        );
        $(document).ready(function() {
            
            $(wrapper).append('<div id="game-cover" class="abs"></div>');
            
            me.canvas = Raphael("game-cover", 755, 562);
            $(me.canvas.canvas).addClass(
                'legacy-game-cover-canvas'
            );
            
            
            me.left = me.canvas.image('/images/left.png', 0, 0, 377, 562);
            me.right = me.canvas.image('/images/right.png', 376, 0, 378, 562);
            $('#game-cover').append(
                '<div id="modernGameCover" aria-hidden="true"></div>'
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
        $('#game-cover').toggleClass(
            'graphics-modern-cover-ready',
            ready === true
        );
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
            me.left.animate({ translation: [-450, 0], rotation: rotation}, 2000, '<', function() {
                $('#game-cover').hide();
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
