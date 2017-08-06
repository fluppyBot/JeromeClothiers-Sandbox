define('BackInStockNotificationAdmin',
[
    'BackInStockNotification.Router',
    'BackInStockNotification.Views.List',
    'BackInStockNotification.Views.Details',
    'BackInStockNotification.Model',
    'BackInStockNotification.Collection'
], function (Router, ListView, DetailsView, Model,Collection)
{
    'use strict';

    return {
        MenuItems: {
            parent: 'settings',
            id: 'backinstocknotification',
            name: _('Back In Stock Subscriptions').translate(),
            url: 'backinstocknotification',
            index: 7
        },
        Router: Router,
        Model: Model,
        Collection: Collection,
        ListView: ListView,
        DetailsView: DetailsView,
        mountToApp: function(application){

            var config = application.Configuration;

            config.BackInStockNotification = config.BackInStockNotification || {};
            _.extend(config.BackInStockNotification, SC.ENVIRONMENT.Efficiencies.BackInStockNotification);
            _.defaults(config.BackInStockNotification, {
                injectOnViewMode: 'code', //or 'template'
                moduleOn: true
            });
            return new Router(application);
        }
    };
});