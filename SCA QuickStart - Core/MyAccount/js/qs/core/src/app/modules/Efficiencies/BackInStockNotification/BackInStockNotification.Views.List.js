define('BackInStockNotification.Views.List', ['BackInStockNotification.Collection','ListHeader'], function (Collection,ListHeader)
{
    'use strict';
    return Backbone.View.extend({
        template: 'backinstocknotification_list',
        page_header: _('Back In Stock Subscriptions').translate(),
        events: {
            'click [data-type="backinstock-delete"]' : 'deleteNotification'
        },
        initialize: function(options)
        {

            this.options = options;
            this.application = options.application;
            this.collection = options.collection;

            this.listenCollection();
            this.setupListHeader();

        },
        deleteNotification: function(e)
        {
            e.preventDefault();
            var self = this,
                $anchor = jQuery(e.target),
                id = $anchor.data('id');

            if(id)
            {
                var line = this.collection.get(id);
                if(line){
                    line.destroy().success(function(){
                        self.showContent();
                    });
                }
            }

        },
        setLoading: function (is_loading)
        {
            this.isLoading = is_loading;
        },

        setupListHeader: function()
        {
            this.listHeader = new ListHeader({
                view: this,
                application: this.application,
                collection: this.collection,
                sorts: this.sortOptions
            });

        },
        showContent: function ()
        {
            this.application.getLayout().showContent(this, 'backinstocknotification', [{text: this.title,	href: '/backinstocknotification'}]);
        },
        listenCollection: function ()
        {
            this.setLoading(true);
            this.collection.on({
                request: jQuery.proxy(this, 'setLoading', true),
                reset: jQuery.proxy(this, 'setLoading', false)
            });
        },
    	sortOptions: [
            {
                value: 'created',
                name: _('by Date').translate(),
                selected: true
            },
            {
                value: 'itemName',
                name: _('by Item').translate()
            }
        ]
    });

});