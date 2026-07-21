var gh = {
    scriptPath: '',
    cssPath: '',
    initialize: function(scripts, css, options) {
        this.scriptPath = scripts;
        this.cssPath = css;
        this.scripts = [];
        this.css = [];
    },
    load: function(plugins, callback, callingObject) {
        //required:
        //plugins (string or array). the name of the plugin to load. if array, means we have several plugins to load
        //callback (function): the function to exe when the plugin is loaded
        //optional:
        //callingObject: used for when a plugin needs to load a sub-plugin
        var me = this;
        if (!me.defined(callingObject)) { callingObject = me; }
        if (typeof plugins === 'string') {
            this.loadPlugin(plugins.toString().toLowerCase(), false, callingObject, function(_) {
                callback(_);
            });
        } else if (me.defined(plugins, 'array')) {
            var pluginCollection = {};
            if (plugins.length === 0) { callback(pluginCollection); }
            $.each(plugins, function(index) {
                var loadCss = false, plugin;
                //if array, means we have css to load (0 index holds plugin name)
                if (me.defined(this, 'array')) {
                    plugin = this[0].toString().toLowerCase();
                    loadCss = true;
                } else {
                    plugin = this.toString().toLowerCase();
                }
                me.loadPlugin(plugin, loadCss, callingObject, function(_) {
                    pluginCollection[plugin] = _;
                    if (index === plugins.length-1) { callback(pluginCollection); }
                });
            });
        }
    },
    loadPlugin: function(plugin, loadCss, callingObject, callback) {
        //required:
        //plugin (string): the name of the plugin (already in all lowercase)
        //loadCss (boolean): true to load associated css with this plugin (from css path)
        //callingObject (object): the object which is loading the plugin. Necessary for ref'ing the plugin after load
        //callback (function): the function to call when finished. As a param should return the loaded plugin
        var me = this;
        if (this.defined(callingObject[plugin])) { 
            callback(callingObject[plugin]);
        } else {
            this.registerScript(this.scriptPath + '/gh.' + me.findParentObject(me, callingObject) + plugin + '.js', function() {
                //if (typeof callingObject[plugin].initialize === 'function') { callingObject[plugin].initialize(); }
                if (loadCss) {
                    me.registerCSS(me.cssPath + '/gh.' + me.findParentObject(me, callingObject) + plugin + '.css');
                }
                callback(callingObject[plugin]);
            });
        }
    },
    registerScript: function(url, callback, async) {
        //required:
        //url (string): the url, internal or external, for the location of the script
        //optional:
        //callback (function): the funtion to exe once the script has loaded
        //async (bool): default value is false, true to load the script asynchronously
        //notes: the function is called both privately by this object (for plugins) but can also be used publically
        this.scripts.push(url);
        $.ajax({
            dataType: 'script',
            async: async || false,
            type: 'GET',
            url: url,
            data: null,
            error: function(data, status) {
                //alert('There was an error trying to load the script: \r\n\r\n' + url + '\r\n\r\nWith the data: ' + data + '\r\n' + status + '\r\n\r\nMake sure the script path is correct.');
            },
            complete: function() {
                if (typeof callback === 'function') { callback(); }
            }
        });
    },
    registerCSS: function(url) {
        //required:
        //url (string): the url, internal or external, for the location of the css script
        //notes: this function assumes a head tag is already present (should be okay since this script is ref'ed from it)
        this.css.push(url);
        var $link = $('<link/>').appendTo('head');
        $link.attr({
            href: url,
            rel: 'stylesheet',
            type: 'text/css'
        });
    },
    findParentObject: function(caller, find) {
        //required:
        //caller (object): the object itself
        //find (string): the key
        var name = '';
        if (caller === find) { return name; }
        var get = function(caller, find) {
            $.each(caller, function(key, value) {
                if (typeof caller[key].initialize === 'function') {
                    if(caller[key] === find) {
                        name += key.toString().toLowerCase() + '.';
                    }
                    get(caller[key], find);
                }
            });
        };
        get(caller, find);
        return name;
    },
    ready: function(object, callback) {
        var me = this;
        setTimeout(function() {
            if (!me.defined(object)) {
                me.ready(object, callback);
            } else {
                callback();
            }
        }, 100);
    },
    defined: function(object, type) {
        //returns bool if defined. type optional: returns if defined matches type
        if (typeof type === 'string') { 
            if (type === 'array') {
                if (typeof object === 'object') { //if looking for an array, it must first be an object
                    if (typeof object.length === 'number' && !(object.propertyIsEnumerable('length')) && typeof object.splice === 'function') {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return (typeof object === type);
            }
        }
        return !(typeof object === 'undefined');
    },
    optimize: function() {
        var me = this;
        $(document).ready(function() {
            var delay = function() {
                $.post(location.pathname, { 
                    js: me.scripts,
                    css: me.css,
                    optimize: true
                });
            };
            setTimeout(delay, 10000);
        });
    }
};
gh.initialize('/js/plugins', '/css/plugins', []);