// ProductListItem.Collection.js
// -----------------------
// Product List collection
define('ProductListItem.Collection', ['ProductListItem.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({
		
		model: Model
		
	,	url: _.getAbsoluteUrl('services/product-list-item.ss')

	,	initialize: function(options) 
		{
			this.options = options; 
		}

		// Collection.update:
		// custom method called by ListHeader view
		// it receives the currently applied filter,
		// currently applied sort and currently applied order
	,	update: function (options)
		{
			this.fetch({
				data: {
					productlistid: this.productListId
				,	internalid: null
				,	sort: options.sort.value
				,	order: options.order
				,	page: options.page
				}
			,	reset: true
			,	killerId: options.killerId
			});
		}
	});
});