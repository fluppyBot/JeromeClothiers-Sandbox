// Quote.Router.js
// -----------------------
define('Quote.Router', ['Quote.Model', 'Quote.Collection', 'Quote.Views'], function (Model, Collection, Views)
{
	'use strict';

	return Backbone.Router.extend({

		routes: {
			'quotes': 'list'
		,	'quotes?:options': 'list'
		,	'quotes/:id': 'details'
		}

	,	initialize: function (application)
		{
			this.application = application;
		}

	,	list: function (options)
		{
			var collection = new Collection()			
			,	view = new Views.List({
					application: this.application
				,	collection: collection
				,	page: options && options.page
				});

			collection.on('reset', jQuery.proxy(view, 'showContent', 'quotes'));

			view.showContent('returns');
		}

	,	details: function (id)
		{
			var model = new Model({
					internalid: id
				})

			,	view = new Views.Details({
					application: this.application
				,	model: model
				});

			model.fetch().then(jQuery.proxy(view, 'showContent', 'quotes'));
		}
	});
});
