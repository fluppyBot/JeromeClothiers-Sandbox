define('Cart.Extensions', ['Cart'], function() {

    'use strict';

    return {
        mountToApp: function(application) {

            var Layout = application.getLayout();

            Layout.goToCart = _.wrap(Layout.goToCart, function(fn) {
                var res = fn.apply(this, Array.prototype.slice.call(arguments, 1));

                jQuery(document).scrollTop(0);

                return res;
            });

        }
    }

});