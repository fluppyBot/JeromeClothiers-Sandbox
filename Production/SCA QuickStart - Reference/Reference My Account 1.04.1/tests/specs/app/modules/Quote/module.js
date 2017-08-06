/*jshint laxcomma:true*/
define(['Quote', 'ListHeader'],function (Quote, ListHeader)
{
	'use strict';

	return describe('Quote', function ()
	{
			describe('Quote', function() 
			{
				it('should have defined "Quote"', function() 
				{
					expect(Quote).toBeDefined();
				});
				
				it('should have defined "Quote.Collection"', function() 
				{
					expect(Quote.Collection).toBeDefined();
				});
				
				it('should have defined "Quote.Model"', function() 
				{
					expect(Quote.Model).toBeDefined();
				});

				it('should have defined "Quote.Router"', function() 
				{
					expect(Quote.Router).toBeDefined();
				});

				it('should have defined "Quote.Views"', function() 
				{
					expect(Quote.Views).toBeDefined();
				});

				it('should have defined "Quote.MenuItems"', function() 
				{
					expect(Quote.MenuItems).toBeDefined();
				});

				it('should have defined "Quote.mountToApp"', function() 
				{
					expect(Quote.mountToApp).toBeDefined();
				});
			});

			describe('Collection', function() 
			{
				var collection = new Quote.Collection()
				,	quote_service = 'services/quote.ss';
				
				it('should have defined "Collection.model"', function ()
				{
					expect(collection.model).toBeDefined();
				});
				
				it('should have defined "Collection.url"', function ()
				{
					expect(collection.url).toBeDefined();
				});
				
				it('should have defined "Collection.parse"', function ()
				{
					expect(collection.parse).toBeDefined();
				});
				
				it('should have defined "Collection.update"', function ()
				{
					expect(collection.update).toBeDefined();
				});

				it('should have to be equal to: "services/quote.ss"', function () 
				{
					expect(collection.url).toEqual(quote_service);
				});
			});

			describe('Model', function() 
			{
				var model = new Quote.Model();
				
				it('should have defined "Model.initialize"', function ()
				{
					expect(model.initialize).toBeDefined();
				});
				
				it('should have defined "Model.urlRoot"', function ()
				{
					expect(model.urlRoot).toBeDefined();
				});

				it('should have to be equal to: "services/quote.ss"', function () 
				{
					expect(model.urlRoot).toEqual('services/quote.ss');				
				});
			});

			describe('Router', function() 
			{
				var router = new Quote.Router()
				,	fake_routes = { 
						'quotes': 'list'
					,	'quotes/:id': 'details'
					,	'quotes?:options': 'list' 
					};

				it('should have defined "Router.routes"', function ()
				{
					expect(router.routes).toBeDefined();
				});

				it('should have defined "Router.initialize"', function ()
				{
					expect(router.initialize).toBeDefined();
				});

				it('should have defined "Router.list"', function ()
				{
					expect(router.list).toBeDefined();
				});

				it('should have defined "Router.details"', function ()
				{
					expect(router.details).toBeDefined();
				});

				it('should have defined "routes"', function () {
					expect(router.routes).toEqual(fake_routes);
				});
			});

		describe('Shared for Views:', function() 
		{
			var showContentSpy = jasmine.createSpy('Mock Show Content function')
			,	application = {
					getLayout: function () 
					{
						return {
							showContent:  showContentSpy
						};
					}
				}
			,	options = {
					application: application
				,	collection: new Quote.Collection()
				,	model: new Quote.Model()
			}
			,	views_list = new Quote.Views.List(options)
			,	views_details = new Quote.Views.Details(options);

			describe('Views', function() 
			{
				describe('Views.List', function() 
				{
					it('should have defined "Views.List.template"', function () {
						expect(views_list.template).toBeDefined();
					});

					it('should have defined "Views.List.title"', function () {
						expect(views_list.title).toBeDefined();
					});

					it('should have defined "Views.List.page_header"', function () {
						expect(views_list.page_header).toBeDefined();
					});

					it('should have defined "Views.List.attributes"', function () {
						expect(views_list.attributes).toBeDefined();
					});

					it('should have defined "Views.List.initialize"', function () {
						expect(views_list.initialize).toBeDefined();
					});

					it('should have defined "Views.List.setupListHeader"', function () {
						expect(views_list.setupListHeader).toBeDefined();
					});

					it('should have defined "Views.List.listenCollection"', function () {
						expect(views_list.listenCollection).toBeDefined();
					});

					it('should have defined "Views.List.setLoading"', function () {
						expect(views_list.setLoading).toBeDefined();
					});

					it('should have defined "Views.List.rangeFilterOptions"', function () {
						expect(views_list.rangeFilterOptions).toBeDefined();
					});

					it('should have defined "Views.List.filterOptions"', function () {
						expect(views_list.filterOptions).toBeDefined();
					});

					it('should have defined "Views.List.sortOptions"', function () {
						expect(views_list.sortOptions).toBeDefined();
					});

					it('should have defined "Views.List.showContent"', function () {
						expect(views_list.showContent).toBeDefined();
					});				
				});

				describe('Views.Details', function() 
				{				
					it('should have defined "Views.Details.template"', function () {
						expect(views_details.template).toBeDefined();
					});

					it('should have defined "Views.Details.title"', function () {
						expect(views_details.title).toBeDefined();
					});

					it('should have defined "Views.Details.attributes"', function () {
						expect(views_details.attributes).toBeDefined();
					});

					it('should have defined "Views.Details.initialize"', function () {
						expect(views_details.initialize).toBeDefined();
					});

					it('should have defined "Views.Details.showContent"', function () {
						expect(views_details.showContent).toBeDefined();
					});
				});
				
				describe('should call the show content of the current layout: ', function() 
				{
					it ('in "Views.List"', function ()
					{
						views_list.showContent();
						expect(application.getLayout().showContent).toHaveBeenCalled();
					});

					it ('in "Views.Details"', function ()
					{
						views_details.showContent();
						expect(application.getLayout().showContent).toHaveBeenCalled();
					});
				});
			});
		});
	});
});
