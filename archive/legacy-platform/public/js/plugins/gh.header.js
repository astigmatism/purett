gh.header = {
    initialize: function() {
        $(document).ready(function() {
            
            $('#topmenu .invite').click(function() {
                gh.facebook.inviteFriends('Invite Friends','I\'ve been playing Pure Triple Triad and thought you\'d like it too!');
            });
            
            //new gh.dropdown('#topmenu');
        });
    }
};
gh.header.initialize ();