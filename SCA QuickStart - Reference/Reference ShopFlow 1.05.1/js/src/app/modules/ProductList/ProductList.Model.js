// ProductLists.Model.js 
// -----------------------
// Model for handling Product Lists (CRUD)
define('ProductList.Model',['ProductListItem.Collection'], function (ProductListItemCollection)
{
	'use strict';

	return Backbone.Model.extend(
	{
		urlRoot: _.getAbsoluteUrl('services/product-list.ss')

	,	defaults : {
			name: ''
		,	description: ''
		,	items : new ProductListItemCollection()
		,	scope : {id: '2', name: 'private'}
		,	type : {id: '1', name: 'default'}
		}

	,	validation:
		{
			name: { required: true, msg: _('Name is required').translate() }
		}

		// redefine url to avoid possible cache problems from browser
	,	url: function()
		{
			var base_url = Backbone.Model.prototype.url.apply(this, arguments);
			
			return base_url + '&t=' + new Date().getTime();
		}
		
	,	initialize: function (data)
		{
			var collection;

			if (data && data.items)
			{
				collection = new ProductListItemCollection(data.items);
			}
			else
			{
				collection = new ProductListItemCollection([]);
			}
			
			this.set('items', collection);			
		}

		// Returns true if an item with id: productId is in the list 
	,	checked: function (productId)
		{
			return this.get('items').some(function (productItem)
			{
				return productItem.item.internalid === productId;
			});
		}

	});

});