gh.tabs = function(wrapper, options) {
    this.construct(wrapper, options);
};
gh.tabs.prototype = {
    construct: function(wrapper, options) {
        this.options = options;
        this.bindEvents(options);
        this.ready(options);
    },
    bindEvents: function(options) {
        var me = this;
        $(document).ready(function() {
            $('#tabs-header div').each(function() {
                var name = $(this).attr('class');
                $(this).click(function() {
                    //if override function defined, run it instead of show
                    if (gh.defined(options.overrides[name], 'function')) {
                        options.overrides[name](me, this);
                    } else {
                        $('#tabs-header div').removeClass('active');
                        $(this).addClass('active');
                        me.show(name);
                    }
                });
            });
        });
    },
    ready: function(options) {
        var me = this;
        $(document).ready(function() {
            if (gh.defined(options.select, 'string')) {
                $('#tabs-header div.' + options.select).trigger('click');
            }
        });
    },
    show: function(className) {
        if(!$('#tabs-content div.active').hasClass(className)) {
            $('#tabs-content div.active').css('z-index','1'); //demote layer of old tab
            $('#tabs-content div.' + className) //promote new tab and start fadedOut
                .fadeTo(0,0)
                .css('z-index','2')
                .addClass('active');
            $('#tabs-content div.' + className).animate({ //fadeIn new
                opacity: 1
            }, 300, function() {
                //on fadeIn complete, hide closed tab
                $('#tabs-content div.active:not(.' + className +')').each(function() {
                    $(this).removeClass('active');
                });
            });
        }
    }
};