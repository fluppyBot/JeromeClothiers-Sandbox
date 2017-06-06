// OrderHistory.Router.js
// -----------------------
// Router for handling orders
define('OrderHistory.Router',  ['OrderHistory.Views', 'PlacedOrder.Model','PlacedOrder.Collection'], function (Views, Model, Collection)
{

	'use strict';

	return Backbone.Router.extend({

		routes: {
			'ordershistory': 'ordersHistory'
		,	'savedorders': 'savedorders'
		,	'ordershistory?:options': 'ordersHistory'
		,	'ordershistory/view/:id': 'orderDetails'
		}

	,	initialize: function (application)
		{
			this.application = application;
		}

	// list orders
	,	savedorders: function(options)
		{
			window.location = SC._applications.MyAccount.getConfig().siteSettings.touchpoints.home + "#cart";
		}
	,	ordersHistory: function (options)
		{
			options = (options) ? SC.Utils.parseUrlOptions(options) : {page: 1};

			options.page = options.page || 1;
			options.search = options.search || "";

			var collection = new Collection(options.search)
			,	view = new Views.List({
					application: this.application
				,	page: options.page
				,	search: options.search
				,	collection: collection
				});

			collection
				.on('reset', view.showContent, view)
				.fetch({
					killerId: this.application.killerId
				,	data: options
				,	reset: true
				});
			//collection.on('change:dateneeded',this.someAction, this);
		}

	// view order's detail
	,	orderDetails: function (id)
		{
			var model = new Model({internalid: id})
			,	view = new Views.Details({
					application: this.application
				,	id: id
				,	model: model
				});

			model
				.on('change', view.showContent, view)
				.fetch();
		}
	});
});
