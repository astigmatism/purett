var config = {
    contextPath: '/js/lib/cometd' //lame global required for cometd scripts
};
gh.cometd = {
    initialize: function() {
        gh.registerScript('/js/lib/cometd/jquery/json2.js', function() {
        gh.registerScript('/js/lib/cometd/org/cometd.js', function() {
        gh.registerScript('/js/lib/cometd/jquery/jquery.cometd.js', function() {
        gh.registerScript('/js/lib/cometd/application.js', function() {
        });
        });
        });
        });
    }
};
gh.cometd.initialize();