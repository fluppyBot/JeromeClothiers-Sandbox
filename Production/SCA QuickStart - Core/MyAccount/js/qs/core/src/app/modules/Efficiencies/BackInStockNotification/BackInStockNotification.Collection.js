define('BackInStockNotification.Collection', ['BackInStockNotification.Model'], function (Model)
{

    'use strict';
    return Backbone.CachedCollection.extend({
        model: Model,
        url: _.getAbsoluteUrl('services/backinstocknotification.ss'),
        update: function (options)
        {
            var filter = options.filter || {};

            this.fetch({
                data: {
                    filter: filter.value,
                    sort: options.sort.value,
                    order: options.order,
                    page: options.page
                },
                reset: true,
                killerId: options.killerId
            });
        },
        parse: function (response)
        {
            this.totalRecordsFound = response.totalRecordsFound;
            this.recordsPerPage = response.recordsPerPage;

            return response.records;
        }
    });
});