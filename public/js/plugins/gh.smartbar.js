gh.smartbar = function(element, manifest) {
    this.construct(element, manifest);
};
gh.smartbar.prototype = {
    element: null,
    manifest: null,
    
    id: null,
    name: null,
    length: null,
    components: null,
    
    loopInterval: null,
    
    construct: function(element, manifest) {
        this.element = element;
        this.manifest = manifest;
        
        this.id = manifest.id;
        this.name = manifest.name;
        this.length = manifest.length;
        this.components = manifest.components;
        
        this.constructLoop(); //setup loop
    },
    destroy: function() {
        $(this.element).empty();
        if (gh.defined(this.loopInterval)) {
            clearInterval(this.loopInterval);
        }
        this.element = null;
        this.manifest = null;
        this.id = null;
        this.name = null;
        this.length = null;
        this.components = null;
        this.onDestroy();
    },
    onDestroy: function() {},
    constructLoop: function() {
        //for animation loops, we simply reset the component attributes to default state
        var me = this;
        if (gh.defined(me.loopInterval)) {
            clearInterval(me.loopInterval); //clear existing
        }
        if (me.length > 0) {
            me.loopInterval = setInterval(function() {
                $.each(me.components, function() {
                    me.renderAttributes($(me.element).find('div.component-' + this.idsmartbarcomponents), this.attributes);
                });
                me.onLoop();
            }, me.length);
        }
    },
    onLoop: function() {}, //overloaded
    render: function(excludeArray) {
        
        var me = this;
        var exclude = [];
        
        if (gh.defined(excludeArray, 'array')) { //if the exclude array is defined, use it
            exclude = excludeArray;
        }
        
        $(me.element).empty();
        
        gh.load(['util', 'swfobject'], function(_) { //requires .flash insert and util plugins
            $.each(me.components, function() {
            
                if($.inArray(this.idsmartbarcomponents, exclude) < 0) { //to render, must not be in exlude array
                    
                    $(me.element).append('<div class="sb-component component-' + this.idsmartbarcomponents + '"></div>');
                    var wrapper = $(me.element).find('div.component-' + this.idsmartbarcomponents);
                    
                    //inject img or swf
                    if (this.type === 'swf') {
                        $(wrapper).flash('/images/smartbar/' + this.idcomponents + '.swf');
                    } else {
                        $(wrapper).append('<img src="/images/smartbar/' + this.idcomponents + '.' + this.type + '" />');
                    }
                    
                    //attributes
                    me.renderAttributes($(wrapper), this.attributes);
                }
            });
        });
    },
    renderAttributes: function(element, manifest, excludeArray) {
        
        var me = this;
        var exclude = [];
        
        if (gh.defined(excludeArray, 'array')) { //if the exclude array is defined, use it
            exclude = excludeArray;
        }
        //defaults:
        $(element).css({
            top: '0px',
            left: '0px',
            display: 'block',
            zindex: '0'
        });
        $.each(manifest, function() {
            if($.inArray(this.idattribute, exclude) < 0) {
                me.renderAttribute($(element), this.name.toLowerCase().stripSpaces(), this.value);
            }
        });
    },
    renderAttribute: function(element, attribute , value) {

        switch(attribute.toLowerCase().stripSpaces()) {
            case 'top':
                $(element).css('top', (value).numbersOnly() + 'px');
                break;
            case 'left':
                $(element).css('left', (value).numbersOnly() + 'px');
                break;
            case 'z-index':
                $(element).css('z-index', (value).numbersOnly());
                break;
            case 'href':
                var resource = $(element).html();
                if ($(element).children(":first")[0].nodeName === 'A') {
                    resource = $(element).children(":first").html();
                }
                $(element).html('<a href="' + value + '" target="_blank">' + resource + '</a>');
                break;
            case 'mouseover':
                $(element).qtip({
                    content: value,
                    show: 'mouseover',
                    hide: 'mouseout',
                    position: {
                        corner: {
                            target: 'center',
                            tooltip: 'bottomLeft'
                        }
                    },
                    style: { 
                        name: 'blue', // Inherit from preset style
                        border: {
                            width: 1,
                            radius: 8,
                            color: '#6699CC'
                        }
                    }
                });
                break;
            case 'hide': 
                if (parseInt(value.numbersOnly()) === 1) {
                    $(element).hide();
                } else {
                    $(element).show();
                }
                break;
            case 'fadein': 
                var fadeIn = function() {
                    $(element).fadeIn(1000);
                };
                setTimeout(fadeIn, value);
                break;
            case 'fadeout': 
                var fadeOut = function() {
                    $(element).fadeOut(1000);
                };
                setTimeout(fadeOut, value);
                break;
        }
    }
};
//auto builder:
$(document).ready(function() {
    $('.smartbar').each(function() {
        new gh.smartbar($(this), $.parseJSON($(this).text())).render();
    });
});