(function (application) {

    'use strict';

    application.on('beforeStartApp', function() {

        var configuration = application.Configuration;

        _.extend(configuration, {

        });

        application.Configuration.sortOptions = [
            {id: 'pricelevel5:asc', name: _('Price, Low to High').translate(), isDefault: true}
        ,   {id: 'pricelevel5:desc', name: _('Price, High to Low ').translate()}
        ];

        application.Configuration.facets = [
			{
				id: 'category'
			,	name: _('Category').translate()
            ,   url: 'item-types'
			,	priority: '10'
			,	behavior: 'hierarchical'
			,	macro: 'facetCategories'
			,	uncollapsible: true
			,	titleToken: '$(0)'
			,	titleSeparator: ', '
			}
		,
            {
            	 id: 'custitem_clothing_type'
            ,    name: _('Item Type').translate()
            ,    priority: '1'
            ,    url: 'custitem_clothing_type'
            ,	 behavior: 'multi'
            ,    uncollapsible: true
            ,    collapsed: false
            ,    titleSeparator: ', '
            }
        ,   {
                 id: 'custitem_vendor_name'
            ,    name: _('Brand').translate()
            ,    priority: '1'
            ,	 behavior: 'multi'
            ,    url: 'brand'
            ,    uncollapsible: false
            ,    collapsed: false
            ,    titleSeparator: ', '
            }
        ,   {
                 id: 'custitem_fabric_color'
            ,    name: _('Fabric Design').translate()
            ,    priority: '2'
			,    url: 'design'
            ,	 behavior: 'multi'
            ,    uncollapsible: false
            ,    collapsed: false
            ,    titleSeparator: ', '
            }
        ,   {
                 id: 'custitem_fabric_weight'
            ,    name: _('Fabric Weight').translate()
            ,    priority: '3'
            ,    url: 'weight'
            ,	 behavior: 'multi'
            ,    uncollapsible: false
            ,    collapsed: false
            ,    titleSeparator: ', '
            }

        ,   {
                id: 'onlinecustomerprice'
            ,   name: _('Price').translate()
            ,   url: 'price'
            ,   priority: '0'
            ,   behavior: 'range'
            ,   macro: 'facetRange'
            ,   uncollapsible: true
            ,   titleToken: 'Price $(0) - $(1)'
            ,   titleSeparator: ', '
            ,   parser: function (value)
                {
                    return _.formatCurrency(value);
                }
            }
        ]

        application.addModule('FitProFile');
        application.addModule('ModalGallery');
    });

}(SC.Application('Shopping')));
