/*
    gh.facebook.js
    required: facebook javascript sdk and FB.init() called
*/
gh.load(['util'], function() {
    gh.facebook = {
        config: {}, //defined after FB init (see facebook view)
        initialize: function() {
            
            $(document).ready(function() {
                setTimeout(function() {
                    FB.Canvas.setAutoResize(); //auto resize every 100ms 
                }, 500);
            });
        },
        permissionDialog: function(permissionTypes, callback) {
            if (gh.defined(permissionTypes, 'string')) {
                permissionTypes = permissionTypes.split(',');
            }
            //first get the current allowed permissions for this user
            FB.getLoginStatus(function(response) {
                var perms = $.parseJSON(response.perms); //because facebook sucks
                $.each(perms.extended, function(index, item) {
                    //remove request for permissions already granted
                    permissionTypes = gh.util.removeValueFromArray(item, permissionTypes);
                });
                if (permissionTypes.length > 0) {
                    FB.ui({
                        method: 'permissions.request', 
                        perms: gh.util.arrayToString(permissionTypes, ',')
                    }, function(response) {
                        if (response && response.perms) {
                            //the user clicked "allow" on premissions request
                            callback(true, response);
                        } else {
                            callback(false, response);
                        }
                    });
                }
            });
        },
        inviteFriends: function(title, message) {
            FB.ui({
                method: 'apprequests',
                title: title,
                message: message,
                filters: ['app_non_users']
            }, function(response) {
            });
        },
        like: function(wrapper) {
            //$(wrapper).append('<div class="like"><iframe src="' + gh.config.protocol + 'www.facebook.com/connect/connect.php?id=' + gh.config.appId + '&connections=0&stream=0&css=' + gh.config.host + 'public/css/' + gh.config.path + '/fan-box.css" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:200px; height:31px;" allowTransparency="true"></iframe></div>');
            //$(wrapper).append('<div id="like" class="abs"><iframe src="https://www.facebook.com/plugins/like.php?app_id=' + gh.data.appid + '&href=http%3A%2F%2Fwww.facebook.com%2Fapps%2Fapplication.php%3Fid%3D' + gh.data.appid + '&send=false&layout=button_count&width=115&show_faces=false&action=like&colorscheme=light&height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:100px; height:31px;" allowtransparency="true"></iframe></div>');
            $(wrapper).append('<div id="like" class="abs"><div class="fb-like" data-href="http://www.facebook.com/pages/Pure-Triple-Triad/306223582753265" data-send="false" data-layout="button_count" data-width="200" data-show-faces="false"></div></div>');
        },
        credits: function(callback) {
            var obj = {
                method: 'pay',
                credits_purchase: true
            };
            
            FB.ui(obj, function(response) {
                callback(response);
            });
        },
        purchase: function(type, id, callback) {
            
            var obj = {
                method: 'pay',
                order_info: {
                    type: type,
                    id: id
                },
                purchase_type: 'item'
            };
            
            FB.ui(obj, function(response) {
                callback({
                    result: response,
                    id: id
                });
            });
        },
        api: function(url, callback) {
            FB.api(url, function(response){
                if (gh.defined(callback, 'function')) {
                    callback(response);
                }
            });
        }
    };
});
gh.facebook.initialize();
