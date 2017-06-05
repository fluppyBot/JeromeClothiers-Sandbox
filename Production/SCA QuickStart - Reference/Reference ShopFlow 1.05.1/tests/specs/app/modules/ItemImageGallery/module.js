/* jshint laxcomma: true */
define(['ItemImageGallery', 'ItemDetails.View', 'ItemDetails.Model'], function (ItemImageGalleryModule, ItemDetailsView, ItemDetailsModel)
{
	'use strict';

	return describe('ItemImageGallery Module', function ()
	{
		var application = null;

		beforeEach(function ()
		{
			application = SC.Application('Test');

			_.extend(application,
			{
				Configuration: {
					macros: {
						itemDetailsImage: 'itemDetailsImage'
					}
				}
			});
		});

		describe('mountToApp', function ()
		{
			it('adds an event listener to initialize on afterAppendView', function ()
			{
				spyOn(ItemImageGalleryModule, 'initialize');

				ItemImageGalleryModule.mountToApp(application);

				application.getLayout().trigger('afterAppendView');

				expect(ItemImageGalleryModule.initialize).toHaveBeenCalled();
				expect(ItemImageGalleryModule.initialize.calls.length).toEqual(1);
			});

			it('only if the environment is the browser', function ()
			{
				spyOn(ItemImageGalleryModule, 'initialize');

				SC.ENVIRONMENT.jsEnvironment = 'server';

				ItemImageGalleryModule.mountToApp(application);

				application.getLayout().trigger('afterAppendView');

				expect(ItemImageGalleryModule.initialize).not.toHaveBeenCalled();
			});
		});

		describe('initialize', function ()
		{
			beforeEach(function ()
			{
				spyOn(ItemImageGalleryModule, 'ItemImageGallery');
			});

			it('instantiates the ItemImageGallery', function ()
			{
				ItemImageGalleryModule.initialize(new ItemDetailsView({
					application: application
				,	model: new ItemDetailsModel()
				}));

				expect(ItemImageGalleryModule.ItemImageGallery).toHaveBeenCalled();
			});

			it('and saves the instance in the view', function ()
			{
				var view = new ItemDetailsView({
						application: application
					,	model: new ItemDetailsModel()
					});

				ItemImageGalleryModule.initialize(view);

				expect(view.imageGallery).toBeDefined();
			});

			it('if the view is the product detailed page', function ()
			{
				ItemImageGalleryModule.initialize(new Backbone.View({
					application: application
				,	model: new ItemDetailsModel()
				}));

				expect(ItemImageGalleryModule.ItemImageGallery).not.toHaveBeenCalled();
			});
		});

		describe('getStartSlide', function ()
		{
			it('if the view had a slider, we want the new one to start in the same place', function ()
			{
				var images = ['a.png', 'b.png', 'c.png']

				,	view = new ItemDetailsView({

						application: application

					,	model: new ItemDetailsModel({
							_images: images
						})
					});

				// ItemImageGalleryModule.initialize(view);

				// expect(ItemImageGalleryModule.getStartSlide(view.imageGallery, images)).toEqual(2);
			});
		});
	});
});