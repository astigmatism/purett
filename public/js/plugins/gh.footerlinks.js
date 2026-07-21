gh.footerlinks = {
    initialize: function() {
        $(document).ready(function() {
            
            //dialogs
            $('#feedback-dialog').dialog({
                autoOpen: false,
                hide: 'fade',
                show: 'fade',
                modal: false,
                draggable: true,
                minWidth: 680,
                minHeight: 445,
                resizable: false,
                buttons: {
                    'All Done': function() {
                        $(this).dialog('close');
                    }
                },
                close: function() {
                    gh.util.reloadIframe($(this).find('iframe')[0]); //reload content on close (start over)
                }
            }).removeClass('moveout'); //this was on to avoid rendering below the game
            
            $('#support-dialog').dialog({
                autoOpen: false,
                hide: 'fade',
                show: 'fade',
                modal: false,
                draggable: true,
                minWidth: 680,
                minHeight: 445,
                resizable: false,
                buttons: {
                    'All Done': function() {
                        $(this).dialog('close');
                    }
                },
                close: function() {
                    gh.util.reloadIframe($(this).find('iframe')[0]); //reload content on close (start over)
                }
            }).removeClass('moveout'); //this was on to avoid rendering below the game
            
            $('#footer-links li.feedback').click(function() {
                $('#feedback-dialog').dialog('open');
            });
            $('#footer-links li.support').click(function() {
                $('#support-dialog').dialog('open');
            });
        });
    }
};
gh.footerlinks.initialize();