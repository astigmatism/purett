gh.cover = function(wrapper) {
    this.initialize(wrapper);
};
gh.cover.prototype = {
    
    canvas:     null,
    left:       null,
    right:      null,
    isopen:       false,
    
    initialize: function(wrapper) {
        var me = this;
        $(document).ready(function() {
            
            $(wrapper).append('<div id="game-cover" class="abs"></div>');
            
            me.canvas = Raphael("game-cover", 755, 562);
            
            
            me.left = me.canvas.image('/images/left.png', 0, 0, 377, 562);
            me.right = me.canvas.image('/images/right.png', 376, 0, 378, 562);
            
        });
    },
    open: function(callback) {
        var me = this;
        if (!me.isopen) {
            me.isopen = true;
            var rotation = (Math.random() * 60) - 30;
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