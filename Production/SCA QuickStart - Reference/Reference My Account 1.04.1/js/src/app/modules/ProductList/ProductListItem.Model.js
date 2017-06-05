// ProductListItem.Model.js
// -----------------------
// Model for handling Product Lists (CRUD)
define('ProductListItem.Model',['ItemDetails.Model'], function (ItemDetailsModel)
{
	'use strict';

	return Backbone.Model.extend(
	{
		urlRoot: _.getAbsoluteUrl('services/product-list-item.ss')

	,	defaults : {
			priority : {id: '2', name: 'medium'}
		,	options: ''
		}
		
		// Name is required
	,	validation: {
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
			this.item = data.item;

			if (this.item && this.item.matrix_parent && this.item.itemoptions_detail)
			{
				this.item.itemoptions_detail.fields = this.item.matrix_parent.itemoptions_detail.fields;
				this.item.matrixchilditems_detail = this.item.matrix_parent.matrixchilditems_detail;
			}

			var itemDetailModel = new ItemDetailsModel(this.item);
			
			itemDetailModel.setOptionsArray(this.getOptionsArray(), true);
			
			this.set('itemDetails', itemDetailModel);
		}

		// Returns options as an array. This is the way ItemDetailModel expects when initialized.
	,	getOptionsArray: function()
		{			
			// Iterate on the stored Product List Item options and create an id/value object compatible with the existing options renderer...
			var option_values = []
			,	selected_options = this.get('options');

			_.each(selected_options, function(value, key) {		
				option_values.push({id: key, value: value.value, displayvalue: value.displayvalue});
			});

			return option_values;
		}	

		// Copied from SC.Application('Shopping').Configuration.itemKeyMapping._name
	,	getProductName: function()
		{
			if (!this.get('item'))
			{
				return null;
			}
			var item = this.get('item');

			// If its a matrix child it will use the name of the parent
			if (item && item.matrix_parent && item.matrix_parent.internalid) 
			{
				return item.matrix_parent.storedisplayname2 || item.matrix_parent.displayname;
			}

			// Otherways return its own name
			return item.storedisplayname2 || item.displayname;
		}
	
		// We need to check if mandatory options are set. No matrix option checking is required for editing a Product List Item.
	,	isSelectionCompleteForEdit: function()
		{
			var item_details = this.get('itemDetails')
			,	posible_options = item_details.getPosibleOptions();
			
			for (var i = 0; i < posible_options.length; i++)
			{
				var posible_option = posible_options[i];
				
				if (posible_option.isMandatory && !item_details.getOption(posible_option.cartOptionId))
				{
					return false;
				}
			}

			return true;
		}
	});
});