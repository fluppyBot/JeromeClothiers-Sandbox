/*jshint laxcomma:true*/
define(['ItemRelations'], function (ItemRelations)
{
	'use strict';

	describe('ItemRelations Module', function ()
	{
		var filter = ItemRelations.ItemRelations.filterRelated
		,	application;

		it('#1 filter_related: item on original array should not be returned', function ()
		{
			// arrange
			var related_items_model = {
				items: [
					{
						relateditems_detail: [
							{ internalid: 1}
						,	{ internalid: 2}
						,	{ internalid: 3}
						]
					}
				]
			};
			var original_array = [1,2];

			// act
			var filtered_result = filter(original_array, related_items_model);

			// assert
			expect(filtered_result.length).toBe(1);
			expect(filtered_result[0].get('internalid')).toBe(3);
		});

		it('#2 filter_related: repeated items should not be returned', function ()
		{
			// arrange
			var related_items_model = {
				items: [
					{
						relateditems_detail: [
							{ internalid: 1}
						,	{ internalid: 2}
						,	{ internalid: 3}
						]
					}
				,	{
						relateditems_detail: [
							{ internalid: 3}
						]
					}
				]
			};
			var original_array = [4,5];

			// act
			var filtered_result = filter(original_array, related_items_model);

			// assert
			expect(filtered_result.length).toBe(3);
			expect(filtered_result[0].get('internalid')).toBe(1);
			expect(filtered_result[1].get('internalid')).toBe(2);
			expect(filtered_result[2].get('internalid')).toBe(3);
		});

		it('#3 mountToApp: showRelatedItems/showCorrelatedItems must be defined after mountToApp', function ()
		{
			// arrange
			application = SC.Application('Test');
			spyOn(ItemRelations.ItemsRelatedModel.prototype, 'fetch');

			// act
			ItemRelations.mountToApp(application);

			// assert
			expect(application.showRelatedItems).toBeDefined();
			expect(application.showRelatedItems instanceof Function).toBeTruthy();

			expect(application.showCorrelatedItems).toBeDefined();
			expect(application.showCorrelatedItems instanceof Function).toBeTruthy();

		});

		it('#4 showRelatedItems: related items model fetch should be invoked with the correct parameters', function ()
		{
			// arrange
			application = SC.Application('Test');
			ItemRelations.mountToApp(application);
			spyOn(ItemRelations.ItemsRelatedModel.prototype, 'fetch').andCallFake(function() {
				return jQuery.Deferred();
			});

			var expected_parameters = { data : { id : '1,2' } };

			// act
			application.showRelatedItems([1,2]);

			// assert
			expect(ItemRelations.ItemsRelatedModel.prototype.fetch).toHaveBeenCalled();
			expect(ItemRelations.ItemsRelatedModel.prototype.fetch).toHaveBeenCalledWith(expected_parameters);

		});

		it('#5 showRelatedItems: fetch ids should be in ASC order for better cache collision', function ()
		{
			// arrange
			application = SC.Application('Test');
			ItemRelations.mountToApp(application);
			spyOn(ItemRelations.ItemsRelatedModel.prototype, 'fetch').andCallFake(function() {
				return jQuery.Deferred();
			});

			var expected_parameters = { data : { id : '1,2,8,15' } };

			// act
			application.showRelatedItems([2,8,15,1]);

			// assert
			expect(ItemRelations.ItemsRelatedModel.prototype.fetch).toHaveBeenCalled();
			expect(ItemRelations.ItemsRelatedModel.prototype.fetch).toHaveBeenCalledWith(expected_parameters);

		});

		it('#6 showCorrelatedItems: correlated items model fetch should be invoked with the correct parameters', function ()
		{
			// arrange
			application = SC.Application('Test');
			ItemRelations.mountToApp(application);
			spyOn(ItemRelations.ItemsCorrelatedModel.prototype, 'fetch').andCallFake(function() {
				return jQuery.Deferred();
			});

			var expected_parameters = { data : { id : '1,2' } };

			// act
			application.showCorrelatedItems([1,2]);

			// assert
			expect(ItemRelations.ItemsCorrelatedModel.prototype.fetch).toHaveBeenCalled();
			expect(ItemRelations.ItemsCorrelatedModel.prototype.fetch).toHaveBeenCalledWith(expected_parameters);

		});

		it('#7 showCorrelatedItems: fetch ids should be in ASC order for better cache collision', function ()
		{
			// arrange
			application = SC.Application('Test');
			ItemRelations.mountToApp(application);
			spyOn(ItemRelations.ItemsCorrelatedModel.prototype, 'fetch').andCallFake(function() {
				return jQuery.Deferred();
			});

			var expected_parameters = { data : { id : '1,2,8,15' } };

			// act
			application.showCorrelatedItems([2,8,15,1]);

			// assert
			expect(ItemRelations.ItemsCorrelatedModel.prototype.fetch).toHaveBeenCalled();
			expect(ItemRelations.ItemsCorrelatedModel.prototype.fetch).toHaveBeenCalledWith(expected_parameters);

		});
	});
});