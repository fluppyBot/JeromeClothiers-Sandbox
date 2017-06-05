// ItemRelations.js
// --------------
// Handles the different relations between items
define('ItemRelations'
,	['ItemRelations.Related.Model', 'ItemRelations.Correlated.Model', 'ItemDetails.Model']
,	function (ItemsRelatedModel, ItemsCorrelatedModel, ItemDetailsModel)
{
	'use strict';

	var filter_related = function (original_items, related_model_items)
	{
		var related_items = related_model_items.items
		,	filtered_related_items = [];

		// check if items aren't repeated and items that aren't already in the original items list (parameter)
		_.each(related_items, function(item){
			var related_array = item.relateditems_detail;
			if(related_array)
			{
				_.each(related_array, function(related) {
					if(_.indexOf(original_items, related.internalid) < 0 && !_.find(filtered_related_items, function(filtered){ return filtered.get('internalid') === related.internalid; }))
					{
						filtered_related_items.push(new ItemDetailsModel(related));
					}
				});
			}
		});

		return filtered_related_items;
	};

	var ItemRelations = {
		filterRelated: filter_related
	};

	return {
		ItemRelations : ItemRelations
	,	ItemsRelatedModel : ItemsRelatedModel
	,	ItemsCorrelatedModel: ItemsCorrelatedModel
	,	mountToApp: function (application)
		{
			// Wires the config options to the url of the models 
			ItemsRelatedModel.prototype.searchApiMasterOptions = application.getConfig('searchApiMasterOptions.relatedItems', {});
			ItemsCorrelatedModel.prototype.searchApiMasterOptions = application.getConfig('searchApiMasterOptions.correlatedItems', {});

			application.showRelatedItems = function (items, $placeholder)
			{
				// check if items is a single value (for instance, item detail page)
				// if its an array, sort the ids in ascending order for better cache collision
				var item_ids = items instanceof Array ? _.sortBy(items, function (id){return id;}) : [items];

				var related_items_model = new ItemsRelatedModel()
				,	items_data = {data:{id: item_ids.join(',')}};

				related_items_model.fetch(items_data).done(function(model){
					
					var filtered_related_items = filter_related(item_ids, model);

					// render the related items macro if there are any
					if(filtered_related_items.length)
					{
						$placeholder.append(
							SC.macros.relatedItems(filtered_related_items, application) 
						);	
					}
				});
			};

			application.showCorrelatedItems = function (items, $placeholder)
			{
				// check if items is a single value (for instance, item detail page)
				var item_ids = items instanceof Array ? _.sortBy(items, function (id){return id;}) : [items];

				var correlated_items_model = new ItemsCorrelatedModel()
				,	items_data = {data:{id: item_ids.join(',')}};

				correlated_items_model.fetch(items_data).done(function(model){
					
					var filtered_related_items = filter_related(item_ids, model);

					// render the related items macro if there are any
					if(filtered_related_items.length)
					{
						$placeholder.append(
							SC.macros.correlatedItems(filtered_related_items, application) 
						);	
					}
				});
			};
		}
	};
});