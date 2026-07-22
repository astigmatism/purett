/* requires jquery ui and jquery */
gh.dialog = function(id, options, callback) {
    
    var buttons = [];
    $.each(options.buttons, function(index, item) {
        buttons.push({
            text: item.name,
            click: function() {
                $('#' + id).dialog('close');
                callback(item);
            }
        });
    });
    
    this.construct(id, options, buttons, callback);
};
gh.dialog.prototype = {
    
    options: null,
    dialog: null,
    id: null,
    
    construct: function(id, options, buttons, callback) {
        var me = this;
        this.id = id;
        
        if ($('#' + id).length === 0) {
            $('#board').append('<div id="' + id + '">' + options.content + '</div>');
            
            this.dialog = $('#' + id).dialog({
                title: options.title || '',
                autoOpen: options.autoOpen || true,
                modal: options.model || false,
                show: options.show || 'fade',
                hide: options.hide || 'fade',
                draggable: options.draggable || true,
                maxWidth: options.maxWidth || false,
                width: options.width || 350,
                minHeight: options.minHeight || 250,
                resizable: options.resizable || false,
                position: options.position || ['center', 'top'],
                buttons: buttons,
                closeOnEscape: false,
                open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },
                close: function() {
                    $('#' + id).dialog('destroy');
                    $('#' + id).remove();
                }
            });
            
            //insert extras
            var widget = $('#' + id).dialog("widget");
            $(widget).appendTo('#content-wrapper');
            
            $(widget).find('.ui-dialog-buttonpane').append('<div class="tail"></div><div class="moogle"></div>');
            
            //top fix
            var parent = $('#' + id).parent();
            parent.css({
                top: 657 - parent.outerHeight(),
                left: Math.round((755 - parent.outerWidth()) / 2)
            });
            
            //style overrides
            //$('.ui-dialog-title').css('font-size','18px');
            //$('.ui-dialog-content').css('font-size','18px');
            
            //cufon title
            //Cufon.replace('.ui-dialog-title', { fontFamily: 'BoisterBlack' });
            
            //cufon content
            //Cufon.replace('.ui-dialog-content', { fontFamily: 'Colaborate-Regular' });
        }
    }
};
