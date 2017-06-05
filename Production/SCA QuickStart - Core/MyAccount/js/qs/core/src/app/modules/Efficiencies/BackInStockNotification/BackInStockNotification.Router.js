define('BackInStockNotification.Router', [
    'BackInStockNotification.Collection',
    'BackInStockNotification.Model',
    'BackInStockNotification.Views.List',
    'BackInStockNotification.Views.Details'
], function(Collection,Model,ListView,DetailsView){

    'use strict';
    return Backbone.Router.extend({

        routes: {
            'backinstocknotification': 'list',
            'backinstocknotification?:options': 'list',
            'backinstocknotification/:id': 'details'
        },
        initialize: function (application)
        {
            this.application = application;
        },

        list: function(options)
        {
            options = (options) ? SC.Utils.parseUrlOptions(options) : {page: 1};
            options.page = options.page || 1;


            var collection = new Collection(),
                view = new ListView({
                    application: this.application,
                    page: options.page,
                    collection: collection
                });
            view.showContent();
            collection.on('sync', view.showContent, view);
            //TODO: weird bug when going from page 1 to 2, and then trying to go back to 1. it gets empty


        }
    });
});