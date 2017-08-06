(function (application) {

    'use strict';

    application.on('beforeStartCoreApp', function() {

        var configuration = application.Configuration;

        application.addModule('Merchandising.Zone.Extensions');
        application.addModule('Home.Extensions');
        application.addModule('Merchandising.Context.RangeFix');
        application.addModule('ItemGalleryArrows');
        application.addModule('FacetTranslatorFix');
        application.addModule('BackInStockNotification');
        application.addModule('Cart.Extensions');

        _.extend(configuration, {
            addThis: {
                enable: true,
                toolboxClass: 'addthis_default_style addthis_toolbox addthis_32x32_style',
                servicesToShow: {
                    facebook: '',
                    google_plusone_share: '',
                    twitter: ''
                }
            },
            itemsDisplayOptions: [
                {id: 'grid', name: 'Grid', macro: 'itemCellGrid', columns: 3, icon: 'fa fa-th', isDefault: true},
                {id: 'table', name: 'Table', macro: 'itemCellTable', columns: 2, icon: 'fa fa-th-large', isDefault: false},
                {id: 'list', name: 'List', macro: 'itemCellList', columns: 1, icon: 'fa fa-th-list', isDefault: false}
            ]
        });

        application.Configuration.facets = _.union(application.Configuration.facets, [
            {
                id: 'category',
                name: _('Category').translate(),
                priority: 0,
                uncollapsible: true,
                collapsed: false,
                titleSeparator: ', '
            }

       ,    {
            	 id: 'custitem_clothing_type'
            ,    name: _('Item Type').translate()
            ,    priority: 1
            ,    url: 'custitem_clothing_type'
            ,    behavior: 'single'
            ,    macro: 'itemCellGrid'   
            ,    uncollapsible: true
			,	 titleToken: '$(0)'
            ,    collapsed: false
            ,    titleSeparator: ', '
            }

        ]);

        application.Configuration.itemOptions = _.union(application.Configuration.itemOptions, [
        ]);

    });

}(SC.Application('Shopping')));