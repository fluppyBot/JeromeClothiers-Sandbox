define('Utils.Extension', function () {

    'use strict';

    var Utils = {
        validateEmail: function (email) {
            var validEmailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (email.length === 0) {
                return _('Email address is required').translate();
            } else if (!validEmailRegex.test(email)) {
                return _('Valid email address is required').translate();
            } else {
                return null;
            }
        }
    };

    _.extend(SC.Utils, Utils);
    _.mixin(Utils);

});
