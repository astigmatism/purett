gh.tip = {
    position: function(api) {
        var trigger = api.getTrigger()[0];
        var tip = api.getTip();
        var conf = api.getConf();
        var triggerRect = trigger.getBoundingClientRect();
        var triggerWidth = triggerRect.width || (triggerRect.right - triggerRect.left);
        var triggerHeight = triggerRect.height || (triggerRect.bottom - triggerRect.top);
        var tipWidth = tip.outerWidth();
        var tipHeight = tip.outerHeight();
        var top = triggerRect.top - tipHeight + conf.offset[0];
        var left = triggerRect.left + triggerWidth + conf.offset[1];

        if (conf.position[0] === 'center') {
            top += (tipHeight + triggerHeight) / 2;
        } else if (conf.position[0] === 'bottom') {
            top += tipHeight + triggerHeight;
        }

        if (conf.position[1] === 'center') {
            left -= (tipWidth + triggerWidth) / 2;
        } else if (conf.position[1] === 'left') {
            left -= tipWidth + triggerWidth;
        }

        return {top: top, left: left};
    }
};

(function($) {
    var slideDirections = {
        up: {property: 'top', start: 1, end: -1},
        down: {property: 'top', start: -1, end: 1},
        left: {property: 'left', start: 1, end: -1},
        right: {property: 'left', start: -1, end: 1}
    };

    if (!$.tools || !$.tools.tooltip) {
        return;
    }

    $.tools.tooltip.addEffect('slide', function(done) {
        var api = this;
        var conf = api.getConf();
        var tip = api.getTip();
        var target = gh.tip.position(api);
        var direction = slideDirections[conf.direction] || slideDirections.up;
        var start = {top: target.top, left: target.left};
        var animation = {top: target.top, left: target.left};

        start[direction.property] += direction.start * conf.slideOffset;
        if (conf.slideFade) {
            start.opacity = 0;
            animation.opacity = conf.opacity;
        }

        tip.css($.extend({position: 'fixed'}, start)).show().animate(
            animation,
            conf.slideInSpeed,
            done
        );
    }, function(done) {
        var api = this;
        var conf = api.getConf();
        var tip = api.getTip();
        var direction = slideDirections[conf.direction] || slideDirections.up;
        var animation = {};
        var current = parseFloat(tip.css(direction.property)) || 0;

        animation[direction.property] = current + (direction.end * conf.slideOffset);
        if (conf.slideFade) {
            animation.opacity = 0;
        }

        tip.animate(animation, conf.slideOutSpeed, function() {
            tip.hide();
            done.call(api);
        });
    });
})(jQuery);
