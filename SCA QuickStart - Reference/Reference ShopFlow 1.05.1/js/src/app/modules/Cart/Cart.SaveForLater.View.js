define('Cart.SaveForLater.View', ['ErrorManagement', 'ProductListDetails.View', 'ProductList.Model', 'ProductListItem.Model', 'Cart.Views', 'Session'], function (ErrorManagement, ProductListDetailsView, ProductListModel, ProductListItemModel, CartViews, Session)
{
	'use strict';

	var view = CartViews.Detailed.extend({

		render : function()
		{
			CartViews.Detailed.prototype.render.apply(this, arguments);

			this.renderSaveForLaterSection();
		}

    ,	renderSaveForLaterSection: function()
		{
			var application = this.model.application;
			
			if (application.getUser().get('isLoggedIn') !== 'T')
			{		
				return;
			}

			var self = this;

			application.getSavedForLaterProductList().done(function(json)
			{
				self.renderSaveForLaterSectionHelper(new ProductListModel(json));
			});		
		}

	,	renderSaveForLaterSectionHelper: function(pl_model)
		{
			var self = this
			,	application = this.model.application;
			
			this.product_list_details_view = new application.ProductListModule.Views.Details({ application: application, model: pl_model, sflMode:true, addToCartCallback:function() {self.addToCart(); } } );
			this.product_list_details_view.template = 'product_list_details_later';
			
			this.$('[data-type=saved-for-later-placeholder]').empty();
			this.$('[data-type=saved-for-later-placeholder]').append(this.product_list_details_view.render().el);
		}

	,	addToCart: function()
		{
			this.showContent();
		}

		// save for later: 
		// handles the click event of the save for later button
		// removes the item from the cart and adds it to the saved for later list
	,	saveForLaterItem: function (e)
		{
			e.preventDefault();

			if (!this.validateLogin())
			{
				return;
			}
			
			this.storeColapsiblesState();

			var product = this.model.get('lines').get(jQuery(e.target).data('internalid'))
			,	internalid = product.get('internalid')
			,	whole_promise = jQuery.Deferred()
			,	self = this;

			if (product.ongoingPromise)
			{
				product.ongoingPromise.then(function (new_line)
				{
					product = self.model.get('lines').get(new_line.latest_addition);

					self.saveForLaterItemHelper(whole_promise, product);
				});
			}
			else
			{
				this.saveForLaterItemHelper(whole_promise, product);
			}	

			this.disableElementsOnPromise(whole_promise, 'article[id="' + internalid + '"] a, article[id="' + internalid + '"] button');
		}

	,	saveForLaterItemHelper: function (whole_promise, product)
		{
			var self = this;

			jQuery.when(this.model.removeLine(product), self.addItemToList(product.get('item'))).then(function() 
			{
				self.showContent();

				self.showConfirmationMessage(_('Good! You saved the item for later. If you want to add it back to your cart, see below in <b>"Saved for later"</b>').translate());

				whole_promise.resolve();
			});
		}
		
		// Add a new product list item into a product list		
	,	addItemToList: function (product)
		{
			var defer = jQuery.Deferred();

			if (this.validateGiftCertificate(product))
			{
				var self = this
				,	application = this.model.application;

				application.getSavedForLaterProductList().done(function(pl_json)
				{
					if (!pl_json.internalid)
					{
						var pl_model = new ProductListModel(pl_json);

						pl_model.save().done(function (pl_json)
						{
							self.doAddItemToList(pl_json.internalid, product, defer);						
						});		
					}
					else
					{
						self.doAddItemToList(pl_json.internalid, product, defer);
					}
				});
			}			
			else
			{
				defer.resolve();
			}			

			return defer.promise();
		}

		// TODO: put this logic in a more abstract/utility class. @static
	,	getItemOptions: function (itemOptions)
		{
			var result = {};

			_.each(itemOptions, function (value, name)
			{
				result[name] = { value: value.internalid, displayvalue: value.label };
			});

			return result;
		}

		// Adds the new item to the collection
	,	doAddItemToList: function (pl_internalid, product, internal_promise)
		{
			var application = this.model.application
			,	product_list_item = {
					description: ''
				,	options: this.getItemOptions(product.itemOptions)
				,	quantity: product.get('quantity')
				,	productList: {
						id: pl_internalid
					}
				,	item: {
						internalid: application.ProductListModule.internalGetProductId(product)
					}
			}
			,	product_list_item_model = new ProductListItemModel(product_list_item);

			product_list_item_model.save().done(function () 
			{				
				internal_promise.resolve();
			});
		}

	,	validateLogin: function ()
		{
			var application = this.model.application;

			if (application.getUser().get('isLoggedIn') === 'F')
			{
				var login = Session.get('touchpoints.login');
				
				login += '&origin=' + application.getConfig('currentTouchpoint');
				login += '&origin_hash=' + Backbone.history.fragment;
				window.location.href = login;
				
				return false;
			}

			return true;
		}
	});

	_.extend(view.prototype.events, 
	{
		'click [data-action="save-for-later-item"]': 'saveForLaterItem'
	});

	return { Detailed: view };
});
