gh.dropdown = function(element) {
    this.construct(element);
};
gh.dropdown.prototype = {
    construct: function(element) {
        (function($){
    
            //cache nav
            var nav = $(element);
    
            //add indicators and hovers to submenu parents
            nav.find("li").each(function() {
                if ($(this).find("ul").length > 0) {
                    
                    //$("<span>").text("^").appendTo($(this).children(":first"));
                    
                    //show subnav on hover
                    $(this).mouseenter(function() {
                        $(this).addClass('submenu');
                        $(this).find("ul").stop(true, true).slideDown();
                    });
                    
                    //hide submenus on exit
                    $(this).mouseleave(function() {
                        var me = this;
                        $(this).find("ul").stop(true, true).slideUp(function() {
                            $(me).removeClass('submenu');
                        });
                    });
                }
            });
        })(jQuery);
    }
};
