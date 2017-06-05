define('Merchandising.Zone.Extensions', ['Merchandising.Zone'], function(MerchandisingZone) {

    'use strict';

    _.extend(MerchandisingZone.prototype, {

        initialize: function ()
        {
            this.addLoadingClass();
            // the listeners MUST be added before the fetch ocurrs
            this.addListeners();

            // add the error handling
            this.promise = this.items.fetch({
                cache: true
            ,   data: this.getApiParams()
            });
        }

    });

});