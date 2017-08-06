// ProductList.js
// -----------------
// Defines the ProductList module (Model, Views, Router). 
define('ProductList',
['ProductListControl.Views', 'ProductListDetails.View', 'ProductList.Collection','ProductList.Model','ProductListItem.Collection','ProductListItem.Model', 'ProductList.Router','ProductListDeletion.View', 'ProductListCreation.View', 'ProductListLists.View'],
function (ProductListControlViews, ProductListDetailsView, ProductListCollection, ProductListModel, ProductListItemCollection, ProductListItemModel, ProductListRouter, ProductListDeleteView, ProductListCreateView, ProductListListsView)
{
	'use strict';

	// ProductLists myaccount's menu items. This is a good example of dynamic-multilevel myaccount's menuitems definition.
	var productlists_dummy_menuitems = function(application) 
	{
		if (!application.ProductListModule.isProductListEnabled()) 
		{
			return undefined;
		}

		return {
			id: 'product_list_dummy'
		,	name: application.ProductListModule.isSingleList() ? _('Loading list...').translate() : _('Loading lists...').translate()
		,	url: ''
		,	index: 2
		};
	}; 

	// Call only when promise was resolved!
	var productlists_menuitems = function(application)
	{
		if (!application.ProductListModule.isProductListEnabled())
		{
			return undefined;
		}

		var product_lists = application.getProductLists()
		,	actual_object = {

			id: function (application)
			{
				// Returns the correct id of the list in the case of single list and 'productlists' otherwise.
				var is_single_list = application.ProductListModule.isSingleList();

				if (is_single_list) 
				{
					var the_single_list = product_lists.at(0);
					// Check if it's a predefined list before return
					return 'productlist_' + (the_single_list.get('internalid') ? the_single_list.get('internalid') : ('tmpl_' + the_single_list.get('templateid')));
				}
				else
				{
					return 'productlists';
				}
			}
		,	name: function (application)
			{
				// The name of the first list in the case of single list or generic 'Product Lists' otherwise
				return application.ProductListModule.isSingleList() ? 
					product_lists.at(0).get('name') :
					_('Product Lists').translate();
			}
		,	url: function (application)
			{				
				// Returns a link to the list in the case of single list and no link otherwise.
				var is_single_list = application.ProductListModule.isSingleList(); 
				if(is_single_list) 
				{
					var the_single_list = product_lists.at(0); 
					return 'productlist/' + (the_single_list.get('internalid') ? the_single_list.get('internalid') : ('tmpl_' + the_single_list.get('templateid'))); 
				}
				else 
				{
					return ''; 
				}
			}
			// Index of the menu item for menu order
		,	index: 2
			// Sub-menu items
		,	children: function (application) 
			{
				// If it's single list, there is no sub-menu
				if (application.ProductListModule.isSingleList())
				{
					return [];
				}
				// The first item (if not single list) has to be a link to the landing page
				var items = [
					{
						id: 'productlist_all'
					,	name: _('All my lists').translate()
					,	url: 'productlists/?'
					,	index: 1
					}
				];
				// Then add all the lists
				product_lists.each(function (productlist)
				{
					items.push({
						id: 'productlist_' + (productlist.get('internalid') || 'tmpl_' + productlist.get('templateid'))
					,	url: 'productlist/' + (productlist.get('internalid') || 'tmpl_' + productlist.get('templateid'))
					,	name: productlist.get('name') + '&nbsp;(' + productlist.get('items').length + ')'
					,	index: 2
					}); 
				});

				return items; 
			}
		}; 

		return actual_object;
	};

	// Encapsulate all product list elements into a single module to be mounted to the application
	// Update: Keep the application reference within the function once its mounted into the application
	var ProductListModule = function()
	{
		var app = {};
		// this application will render some of its views in existing DOM elements (placeholders)
		var placeholder = {
			control: '[data-type="product-lists-control"]'
		};

		var views = {
				Control: ProductListControlViews
			,	Details: ProductListDetailsView
			,	NewList: ProductListCreateView
			,	Lists: ProductListListsView
			,	Delete: ProductListDeleteView
			}
		,	models = {
				ProductList: ProductListModel
			,	ProductListItem: ProductListItemModel
			}
		,	collections = {
				ProductList: ProductListCollection
			,	ProductListItem: ProductListItemCollection
			};

		// is the Product-List functionality available for this application?
		var isProductListEnabled = function () 
		{
			var application = app;

			return application.getConfig('product_lists') !== undefined;
		};

		// are we in the single-list modality ? 
		var isSingleList = function ()
		{
			var application = app;

			return !application.getConfig('product_lists.additionEnabled') && 
				application.getConfig('product_lists.list_templates') && 
				_.filter(application.getConfig('product_lists.list_templates'), function (pl) { return !pl.type || pl.type.name !== 'later'; }).length === 1 ;
		};

		var mountToApp = function (application)
		{
			app = application;

			// Loads Product Lists collection model singleton
			application.getProductListsPromise = function ()
			{
				if (!application.productListsInstancePromise)
				{
					application.productListsInstancePromise = jQuery.Deferred();
					application.productListsInstance = new ProductListCollection();
					application.productListsInstance.application = application;
					application.productListsInstance.fetch().done(function(jsonCollection) 
					{
						application.productListsInstance.set(jsonCollection);						
						application.productListsInstancePromise.resolve(application.productListsInstance);
					});
				}

				return application.productListsInstancePromise;
			};

			application.getProductLists = function ()
			{
				if (!application.productListsInstance)
				{
					application.productListsInstance = new ProductListCollection();
					application.productListsInstance.application = application;
				}

				return application.productListsInstance;
			};

			// obtain a single ProductList with all its item's data
			application.getProductList = function (id)
			{
				var productList = new ProductListModel();

				productList.set('internalid', id);
				
				return productList.fetch();
			};

			// obtain a single Saved for Later ProductList with all its item's data
			application.getSavedForLaterProductList = function ()
			{
				var productList = new ProductListModel();

				productList.set('internalid', 'later');
				
				return productList.fetch();
			};

			// Application.ProductListModule - reference to this module
			application.ProductListModule = ProductListModule;

			application.getUserPromise().done(function () 
			{
				if (SC.ENVIRONMENT.PRODUCTLISTS_CONFIG)
				{
					application.Configuration.product_lists = SC.ENVIRONMENT.PRODUCTLISTS_CONFIG;
				}

				// if Product Lists are not enabled, return...
				if (application.ProductListModule.isProductListEnabled())
				{
					var layout = application.getLayout();

					// rendering product lists
					application.ProductListModule.renderProductLists();
					
					layout.on('afterAppendView', function (view)
					{
						application.ProductListModule.renderProductLists(view);	
					});

					layout.on('afterAppendToDom', function ()
					{
						application.ProductListModule.renderProductLists();
					});

					// Put this code block outside afterAppendView to avoid infinite loop!
					application.getProductListsPromise().done(function()
					{
						// Replace dummy menu item from My Account
						layout.replaceMenuItem && layout.replaceMenuItem(function (menuitem)
						{
							return menuitem && menuitem.id === 'product_list_dummy';
						}, productlists_menuitems);

						layout.updateMenuItemsUI && layout.updateMenuItemsUI();

						if (application.ProductListModule.isSingleList())
						{
							// Update header profile link for single product list...
							var the_single_list = application.getProductLists().at(0)
							,	product_list_menu_item = layout.$('.header-profile-single-productlist');

							if (the_single_list && product_list_menu_item)
							{
								var product_list_hashtag = '#productlist/' + (the_single_list.get('internalid') ? the_single_list.get('internalid') : ('tmpl_' + the_single_list.get('templateid')));							
								
								product_list_menu_item.text(the_single_list.get('name'));
								product_list_menu_item.attr('data-hashtag', product_list_hashtag);

								layout.updateUI();
							}
						}						
					});

					ProductListItemModel.prototype.keyMapping = application.getConfig('itemKeyMapping', {});
					ProductListItemModel.prototype.itemOptionsConfig = application.getConfig('itemOptions', []);
				}
			});

			// always start our router.
			return new ProductListRouter(application);
		};

		// renders the control used in shopping pdp and quickview
		var renderControl = function (view_)
		{	
			var application = app;

			jQuery(placeholder.control).each(function()
			{
				var view = view_ || application.getLayout().currentView
				,	is_single_list_mode = application.ProductListModule.isSingleList()
				,	$container = jQuery(this);

				application.getProductListsPromise().done(function()
				{
					// this control needs a reference to the StoreItem model !
					if (view && view.model && view.model.getPosibleOptions)
					{
						var control = null;

						if (is_single_list_mode)
						{
							control = new ProductListControlViews.ControlSingle({
								collection: application.getProductLists()
							,	product: view.model
							,	application: application
							});
						}
						else 
						{
							control = new ProductListControlViews.Control({
								collection: application.getProductLists()
							,	product: view.model
							,	application: application
							});
						}

						$container.empty().append(control.$el);
						control.render();
					}
				});

				if (application.getProductListsPromise().state() === 'pending')
				{
					$container.empty().append('<button class="btn">' + is_single_list_mode ? _('Loading list...').translate() : _('Loading lists...').translate() + '</button>');
				}
			}); 
		};

		// render all product-lists related widgets
		var renderProductLists = function (view)
		{	
			var application = app;

			if (!application.ProductListModule.isProductListEnabled())
			{
				return;
			}

			//global variable with the customer internalid. TODO: stop using it! use application.getUser().get('internalid') instead
			SC.ENVIRONMENT.customer_internalid = application.getUser().get('internalid'); 

			application.ProductListModule.renderControl(view);
		};

		// Gets the internal product id for a store item considering it could be a matrix child. TODO: move this to ItemDetails.Model.
		var internalGetProductId = function (product)
		{
			// If its matrix its expected that only 1 item is selected, not more than one nor 0 
			if (product.getPosibleOptions().length)
			{
				var selected_options = product.getSelectedMatrixChilds();

				if (selected_options.length === 1)
				{
					return selected_options[0].get('internalid') + '';
				}
			}

			return product.get('_id') + '';
		};

		return {
			Views : views
		,	Models: models
		,	Collections: collections
		,	Router: ProductListRouter
		,	isProductListEnabled: isProductListEnabled
		,	isSingleList: isSingleList
		,	mountToApp: mountToApp
		,	renderControl: renderControl
		,	renderProductLists: renderProductLists
		,	internalGetProductId: internalGetProductId
		,	placeholder: placeholder
		,	MenuItems: productlists_dummy_menuitems
		};

	}();

	return ProductListModule;
});
