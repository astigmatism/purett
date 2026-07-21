gh.util = {
    uniqueNumber: 0,
    initialize: function() {
        
        //append javascript here since other plugins may need it asap
        String.prototype.stripSpaces = function(){
            return this.replace( /\s/g, "" );
        };
        String.prototype.numbersOnly = function(){
            return this.replace( /\D/g, "" );
        };
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g,"");
        };
        String.prototype.ltrim = function() {
            return this.replace(/^\s+/,"");
        };
        String.prototype.rtrim = function() {
            return this.replace(/\s+$/,"");
        };
        String.prototype.replaceMultiple = function(array) {
            var value = this;
            $.each(array, function() {
                value = value.replace(this[0], this[1]);
            });
            return value;
        };
        String.prototype.capitaliseFirstLetter = function() {
            return this.charAt(0).toUpperCase() + this.slice(1);
        };
        
        String.prototype.firstLetterLastName = function() {
            var name = this.split(' ');
            var from = name[0];
            if (name.length > 1) {
                from += ' ' + name[1].charAt(0).toUpperCase() + '.';
            }
            return from;
        };
        
        Number.prototype.addCommas = function() {
            var value = this.toString();
            var x = value.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        };
        Number.prototype.addOrdinal = function() {
            var value = this.toString();
            var l = value.length, r = parseInt(value.substring(l-2,l), 10), i = value % 10;
            var suffix = ((r < 11 || r > 19) && (i < 4)) ? ['th','st','nd','rd'][i] : 'th';
            return value + suffix;
        };
        Array.prototype.remove = function(from, to) {
          var rest = this.slice((to || from) + 1 || this.length);
          this.length = from < 0 ? this.length + from : from;
          return this.push.apply(this, rest);
        };
        
        this.uniqueNumber = (new Date()).getTime();
        
        $.cookie('screenHeight', screen.height);
        $.cookie('screenWidth', screen.width);
    },
    disableUIButtons: function(bool, wrapper) {
        //for use with jqueryUI buttons only (would you use anything else?)
        if (gh.defined(wrapper)) {
            $('body button').button({ disabled: bool });
        } else {
            $(wrapper).find('button').button({ disabled: bool });
        }
    },
    getUniqueNumber: function() {
        return this.uniqueNumber++;
    },
    reloadIframe: function(iframe) {
        if (gh.defined($(iframe).attr('src'), 'string')) {
            $(iframe).attr('src', $(iframe).attr('src'));
        }
    },
    getQueryString: function() {
        return window.location.search.substring(1);
    },
    getQueryStringJSON: function() {
        var response = {};
        var e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&=]+)=?([^&]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = window.location.search.substring(1);
    
        while (e = r.exec(q)) {
           response[d(e[1])] = d(e[2]);
        }
        return response;
    },
    preloadImages: function(images) {
        $(images).each(function(){
            //$('<img/>')[0].src = this;
            // Alternatively you could use:
            (new Image()).src = this;
        });
    },
    getScreenHeight: function() {
        return screen.height;
    },
    getScreenWidth: function() {
        return screen.width;
    },
    arrayToString: function(array, delimiter) {
        var result = '';
        $.each(array, function(index, item) {
            result += item.toString() + (index === (array.length-1) ? '' : ',');
        });
        return result;
    },
    redirect: function(url) {
        //top.location.href = url;
        window.open(url, '_blank');
    },
    removeValueFromArray: function(value, array) {
        return $.grep(array, function(item) {
            return item != value;
        });
    },
    isset: function(value) {
        if (typeof value === 'undefined') {
            return false;
        }
        if (value == null) {
            return false;
        }
        if (typeof value === 'string') {
            if (value.length === 0) {
                return false;
            }
        }
        return true;
    },
    hasProperty: function(object, property) {
        if (gh.defined(object, 'object')) {
            if (gh.util.isset(object)) {
                var parts = property.split('.'), i = 0;
                for(i, l = parts.length; i < l; i++) {
                    var part = parts[i];
                    if(part in object) {
                        object = object[part];
                    } else {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    },
    
    
    //Gamehouse specific
    
    handlecallback: function(callback, response) {
        var me = this;
        //this function callbacks to either js or swf based on type of callback
        switch (typeof callback) {
            case 'function':
                callback(response);
                break;
            case 'string':
                //console.log({ callback: callback, response: response });
                me.game.callback(callback, response);
                break;
        }
    }
};
jQuery.cookie = function (key, value, options) {
    
    // key and at least value given, set cookie...
    if (arguments.length > 1 && String(value) !== "[object Object]") {
        options = jQuery.extend({}, options);

        if (value === null || value === undefined) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }
        
        value = String(value);
        
        return (document.cookie = [
            encodeURIComponent(key), '=',
            options.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path ? '; path=' + options.path : '',
            options.domain ? '; domain=' + options.domain : '',
            options.secure ? '; secure' : ''
        ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || {};
    var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
};
gh.util.initialize();