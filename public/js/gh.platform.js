gh.platform = {
    initialize: function () {
        $.ajaxSetup({
            headers: {'X-CSRF-Token': gh.data.csrf},
            statusCode: {
                401: function () { window.location.href = '/auth/login'; }
            }
        });
    },
    idempotencyKey: function () {
        var bytes = new Uint8Array(16), output = 'purchase:';
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
            for (var i = 0; i < bytes.length; i += 1) output += ('0' + bytes[i].toString(16)).slice(-2);
            return output;
        }
        return output + String(new Date().getTime()) + ':' + String(Math.random()).slice(2);
    },
    purchase: function (type, id, callback) {
        $.ajax({
            url: '/purchase',
            type: 'POST',
            dataType: 'json',
            data: {type: type, id: id, idempotency_key: this.idempotencyKey()},
            success: function (response) {
                if (response.result) {
                    gh.data.coins = response.result.balance;
                    $('.coin-balance').text(gh.data.coins);
                }
                callback(response);
            },
            error: function (response) {
                var message = 'Purchase could not be completed.';
                try { message = $.parseJSON(response.responseText).error || message; } catch (ignore) {}
                callback({result: {status: 'failed', error: message}});
            }
        });
    },
    setColor: function (color, callback) {
        $.ajax({
            url: '/index/color',
            type: 'POST',
            dataType: 'json',
            data: {color: color},
            success: callback
        });
    },
    logout: function () {
        var form = $('<form method="post" action="/auth/logout"></form>');
        form.append($('<input type="hidden" name="csrf_token" />').val(gh.data.csrf));
        form.appendTo('body').submit();
    }
};
gh.platform.initialize();
