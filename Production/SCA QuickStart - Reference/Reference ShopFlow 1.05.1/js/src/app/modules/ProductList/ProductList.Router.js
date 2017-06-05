// CreditCard.Router.js
// -----------------------
// Router for handling Product lists 
define('ProductList.Router', ['ProductList.Model'], function (ProductListModel)
{
	'use strict';

	return Backbone.Router.extend({

		routes: 
		{
			'productlists': 'showProductListsList'
		,	'productlists/?*options': 'showProductListsList'
		,	'productlist/:id': 'showProductListDetails'
		,	'productlist/:id/?*options': 'showProductListDetails'
		}

	,	initialize: function (application)
		{
			this.application = application;
		}

		// resolve the Product list details routes that can be of form /productlist/$(internalid) or 
		// /productlist/tmpl_$(templateid) in the case the record doesn't exist yet (predefined lists)
	,	showProductListDetails: function (id, options)
		{
			var prefix = 'tmpl_'
			,	self = this
			
			// TODO: this is bad, lets fix it.
			,	index_of_question = id.indexOf('?')
			,	internalid;

			if (index_of_question !== -1)
			{
				options = id.substring(index_of_question);
				internalid = parseInt(id, 10);

				if (!isNaN(internalid))
				{
					id = internalid + '';
				}
			}

			if (id.indexOf(prefix) === 0)
			{ 
				// then this is a predefined template that doesn't exist yet (without internalid)
				var template_id = id.substring(prefix.length, index_of_question !== -1 ? index_of_question : id.length)
				,	product_lists_promise = self.application.getProductLists().fetch();

				product_lists_promise.done(function() 
				{
					var template = self.application.getProductLists().findWhere({templateid: template_id});
					
					self.doShowProductListDetails(template, options);
				});
			}
			else
			{
				self.application.getProductList(id).done(function(model) 
				{
					self.doShowProductListDetails(new ProductListModel(model), options);
				});
			}
		}

		// Render the product list details view
	,	doShowProductListDetails: function(model, options)
		{
			var params_options = _.parseUrlOptions(options)
			,	view = new this.application.ProductListModule.Views.Details({
				application: this.application
			,	params: params_options
			,	model: model
			,	includeSortingFilteringHeader: true
			});

			view.showContent('productlist_' + (model.get('internalid') ? model.get('internalid') : 'tmpl_' + model.get('templateid')));
		}

		// Render the product lists landing page
	,	showProductListsList: function (options)
		{
			var self = this;

			this.application.getProductListsPromise().done(function ()
			{				
				var params_options = _.parseUrlOptions(options)
				,	view = new self.application.ProductListModule.Views.Lists({
						application: self.application
					,	params: params_options
					,	collection: self.application.getProductLists()
					});

				view.showContent('productlist_all');
			});
		}
	});
});
