// ItemDetails.Model.js
// --------------------
// Represents 1 single product of the web store
define('ItemDetails.Model', ['ItemOptionsHelper', 'Session'], function (ItemOptionsHelper, Session)
{
	'use strict';

	var Collection = null;

	var Model = Backbone.CachedModel.extend({

		url: function()
		{
			var url = _.addParamsToUrl(
				'/api/items'
			,	_.extend(
					{}
				,	this.searchApiMasterOptions
				,	Session.getSearchApiParams()
				)
			);

			return url;
		}

		// The api returns the items as an array allways this takes care of returning the object
	,	parse: function (response)
		{
			// if we are performing a direct API call the item is response.items[0]
			// but if you are using the ItemDetails.Collection to fetch this guys
			// The item is the response
			var single_item = response.items && response.items[0];

			if (single_item)
			{
				single_item.facets = response.facets;
			}

			return single_item || response;
		}

	,	initialize: function ()
		{
			this.itemOptions = {};

			if (_.isArray(this.get('options')))
			{
				this.setOptionsArray(this.get('options'), true);
			}
		}

	,	getOption: function (option_name)
		{
			return this.itemOptions[option_name];
		}

	,	setOptionsArray: function (options, dont_validate)
		{
			var self = this;
			_.each(options, function (option)
			{
				self.setOption(option.id, {
					internalid: option.value
				,	label: option.displayvalue ? option.displayvalue : option.value
				}, dont_validate);
			});
		}

	,	setOption: function (option_name, value, dont_validate)
		{
			// Setting it to null means you dont wan a value for it
			if (option_name === 'quantity')
			{
				var quantity = parseFloat(value).toFixed(2) == NaN ? 1 : parseFloat(value).toFixed(2);
				this.set('quantity', quantity);
				// this.set('quantity', parseInt(value, 10) || 1);
			}
			else if (_.isNull(value))
			{
				delete this.itemOptions[option_name];
			}
			else
			{
				// Sometimes the name comes in all uppercase
				var option = this.getPosibleOptionByCartOptionId(option_name) || this.getPosibleOptionByCartOptionId(option_name.toLowerCase());

				// You can pass in the internalid on the instead of the full item
				if (option && option.values)
				{
					value = _.isObject(value) ? value : _.where(option.values, {internalid: value.toString()})[0];
				}
				else if (!_.isObject(value))
				{
					value = {
						internalid: value
					,	label: value
					};
				}

				// if it's a matrix option this will make sure it's compatible to what its already set!
				if (!dont_validate && option.isMatrixDimension && !_.contains(this.getValidOptionsFor(option.itemOptionId), value.label))
				{
					throw new RangeError('The combination you selected is invalid');
				}
				if (option && option.cartOptionId)
				{
					this.itemOptions[option.cartOptionId] = value;
				}

			}
			return value;

		}

	,	getItemOptionsForCart: function ()
		{
			var result = {};

			_.each(this.itemOptions, function (value, name)
			{
				result[name] = value.internalid;
			});

			return result;
		}

		// model.get:
		// We have override the get function for this model in order to honor the itemsKeyMapping
		// It also makes sure that _matrixChilds and _relatedItems are ItemDetails.Collection and
		// _matrixParent is an ItemDetails.Model
		// TODO: Deprecate the dont_cache param and make sure that mappings to functions are not chaced
	,	get: function (attr, dont_cache)
		{
			var keyMapping = this.keyMapping || (this.collection && this.collection.keyMapping);

			if (dont_cache || (keyMapping && !this.attributes[attr] && keyMapping[attr]))
			{
				var mapped_key = keyMapping[attr];

				if (_.isFunction(mapped_key))
				{
					this.attributes[attr] = mapped_key(this);
				}
				else if (_.isArray(mapped_key))
				{
					for (var i = 0; i < mapped_key.length; i++)
					{
						if (this.attributes[mapped_key[i]])
						{
							this.attributes[attr] = this.attributes[mapped_key[i]];
							break;
						}
					}
				}
				else
				{
					this.attributes[attr] = this.attributes[mapped_key];
				}

				if (attr === '_matrixChilds' || attr === '_relatedItems')
				{
					Collection = Collection || require('ItemDetails.Collection');
					this.attributes[attr] = new Collection(this.attributes[attr] || []);
				}
				else if (attr === '_matrixParent')
				{
					this.attributes[attr] = new Model(this.attributes[attr] || {});
				}
			}

			return this.attributes[attr];
		}

		// model.getPrice:
		// Gets the price based on the selection of the item and the quantity
	,	getPrice: function ()
		{
			var self = this
			,	details_object = this.get('_priceDetails') || {}
			,	matrix_children = this.getSelectedMatrixChilds()
			,	result =  new Object;
			
			if(SC.ENVIRONMENT.PROFILE.customPriceLevel != ""){
				var url = _.addParamsToUrl(
					'/api/items'
				,	{
					'fieldset':'tailorpricelevel'
				,	'id': this.get("internalid")
				}
				);
				if(url){
					jQuery.get(url).done(function(data){
						var customPrice = data.items[0]['pricelevel' + SC.ENVIRONMENT.PROFILE.customPriceLevel];

						if(SC._applications.Shopping.getLayout().currentView.attributes.id == "facet-browse"){
							if(customPrice){
								jQuery("[data-item-id=" + self.id + "] .lead-price").html(_.formatCurrency(customPrice));
								jQuery("[data-item-id=" + self.id + "] .lead-price").data("rate", customPrice);
							} else {
								jQuery("[data-item-id=" + self.id + "] .lead-price").html("");
								jQuery("[data-item-id=" + self.id + "] .lead-price").data("rate", 0);
							}
						} else {
							if(customPrice){
								jQuery('.lead-price').html(_.formatCurrency(customPrice));
								jQuery('.lead-price:first').attr("data-rate", customPrice);
							} else {
								jQuery('.lead-price').html("");
								jQuery('.lead-price').data("rate", 0);
							}
						}
					});
					result.price = "0";
					result.price_formatted = "loading...";

					return result;
				}
			} else {
				result.price_formatted = _.formatCurrency("");
				result.price = "0";
				return result;
			}
		}


		// model.getStockInfo
		// Returns an standard formated object for the stock info taking in consideration current matrix option selection.
		// the loginc is the following: if there is an unique child selected use that. Else use the parent as default
		// values and open children properties if it has the same value for all selected childs.
	,	getStockInfo: function ()
		{
			// Standarize the result object
			var matrix_children = this.getSelectedMatrixChilds()

				// if we have one selected child we use that - else we use the parent as default
			,	model = matrix_children.length === 1 ? matrix_children[0] : this

			,	parent = this.get('_matrixParent')

			,	stock_info = {
					stock: model.get('_stock')
				,	isInStock: model.get('_isInStock')

				,	outOfStockMessage: model.get('_outOfStockMessage') || this.get('_outOfStockMessage') || (parent && parent.get('_outOfStockMessage')) || _('Out of Stock').translate()
				,	showOutOfStockMessage: model.get('_showOutOfStockMessage')

				,	inStockMessage: model.get('_inStockMessage')
				,	showInStockMessage: model.get('_showInStockMessage')

				,	stockDescription: model.get('_stockDescription')
				,	showStockDescription: model.get('_showStockDescription')
				,	stockDescriptionClass: model.get('_stockDescriptionClass')
			}

			,	is_something_selected = _(this.getMatrixOptionsSelection()).keys().length;

			// if this is an open selection we compute them all
			if (is_something_selected && matrix_children.length > 1)
			{
				var matrix_children_stock_info = [];

				_.each(matrix_children, function (child)
				{
					matrix_children_stock_info.push(child.getStockInfo());
				});

				// If all matrix childs return the same value for a given attribute that becomes the output,
				// with the exeption of stock that is an adition of the stocks of the childs - but only if the parent has
				_.each(stock_info, function (value, key)
				{
					var children_values_for_attribute = _.pluck(matrix_children_stock_info, key);

					if (key === 'stock')
					{
						stock_info.stock = _.reduce(children_values_for_attribute, function (memo, num)
						{
							return memo + num;
						}, 0);
					}
					else if (key === 'isInStock')
					{
						// the parent is in stock if any of the child items is in stock
						// so, if in the array of the values of 'isInStock' for the childs
						// there is a 'true', then the parent item is in stock
						stock_info.isInStock = _.contains(children_values_for_attribute, true);
					}
					else
					{
						children_values_for_attribute = _.uniq(children_values_for_attribute);

						if (children_values_for_attribute.length === 1)
						{
							stock_info[key] = children_values_for_attribute[0];
						}
					}
				});
			}

			return stock_info;
		}

		// model.isReadyForCart:
		// if it has mandatory options, checks for all to be filled
		// also checks if the item is purchasable
	,	isReadyForCart: function ()
		{
			// if the item is a matrix, we check if the selection is completed
			// for non-matrix items isSelectionComplete always returns true
			if (this.isSelectionComplete())
			{
				var is_purchasable = this.get('_isPurchasable')
				,	child = this.getSelectedMatrixChilds();

				if (child.length)
				{
					is_purchasable = child[0].get('_isPurchasable');
				}

				return is_purchasable;
			}

			return false;
		}
	});

	Model.prototype = _.extend(Model.prototype, ItemOptionsHelper);

	return Model;
});
