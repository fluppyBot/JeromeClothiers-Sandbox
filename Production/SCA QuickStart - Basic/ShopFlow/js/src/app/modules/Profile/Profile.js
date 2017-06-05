// Profile.js
// ----------
// Stores all data related to the User
// Has methods to get and set the Recently Viewed Items
define('Profile', ['Facets.Model'], function (FacetsModel)
{
	'use strict';
	
	var Profile = {

		urlRoot: 'services/profile.ss'

	,	addHistoryItem: function(item)
		{
			if (item)
			{
				// If the item is already in the recently viewed, we remove it
				this.recentlyViewedItems.get('items').remove(item);
				
				// we add the item at the beginning of a collection
				this.recentlyViewedItems.get('items').unshift(item);

				if (this.useCookie)
				{
					var current_items = jQuery.cookie('recentlyViewedIds')
					,	news_items = _.union(this.recentlyViewedItems.get('items').pluck('internalid'), current_items);

					jQuery.cookie('recentlyViewedIds', _.first(news_items, this.numberOfItemsDisplayed));
				}
			}
		}

	,	loadItemsFromCookie: function ()
		{
			// create an array of ID items to get only the elements that are present in the cookie but are not present in memory
			var cookie_ids = jQuery.cookie('recentlyViewedIds') || [];
			
			cookie_ids = !_.isArray(cookie_ids) ? [cookie_ids] : cookie_ids;
			
			var	items_ids = _.difference(cookie_ids, this.recentlyViewedItems.get('items').pluck('internalid')).join(',')
			,	self = this;

			if (items_ids)
			{
				//return promise (http://api.jquery.com/promise/)
				return this.facetsModel.fetch({data:{id: items_ids}}, {silent: true}).done(function()
				{
					self.facetsModel.get('items').each(function (model)
					{
						// find the position of the item on the cookie
						var index = _(cookie_ids).indexOf(model.get('_id'));
						// add item to recentlyViewedItems at the position
						self.recentlyViewedItems.get('items').add(model, {at: index});
					});
				});
			}
			
			return jQuery.Deferred().resolve();
		}

	,	renderRecentlyViewedItems: function (view)
		{
			var self = this
			,	$container = view.$('[data-type="recently-viewed-placeholder"]')
			,	macro = SC.macros[$container.data('macro') || 'recentlyViewed'];

			return this.getRecentlyViewedItems().then(function ()
			{
				var items = self.recentlyViewedItems.get('items');
				
				items.remove(items.get(view.model.id));

				$container.html(macro(items.first(self.numberOfItemsDisplayed), view.options.application));
			});
		}
		
	,	getRecentlyViewedItems: function ()
		{
			return this.useCookie ? this.loadItemsFromCookie() : jQuery.Deferred().resolve();
		}
	,	setUserOptionConfig: function(callback, values)
		{
			// load design option restriction
			var param = new Object()
			,	userOptions = new Object()
			,	designRestrictions = null
			,	favouriteOptions = null
			,	self = this;

			param.type = "get_designoption_restriction";
			param.id = SC._applications.Shopping.getUser().get('internalid');
			var dateRef = new Date();
			var urlDesignOptions = _.getAbsoluteUrl('js/DesignOptions_Config.json') + '?t=' + dateRef.getTime();

			// http://jerome.production.netsuitestaging.com/SSP%20Applications/SCA%20QuickStart%20-%20Basic/Global/js/DesignOptions_Config.json
			// retrieve config
			//jQuery.get(_.getAbsoluteUrl('js/DesignOptions_Config.json')).done(function(data){
			jQuery.get(urlDesignOptions).done(function(data){
				var options_config = JSON.parse(data);
				userOptions.options_config = options_config;
				
				//console.log('options_config: ' + '\n' + JSON.stringify(options_config, 'key', '\t'))
				
				// retrieve favourite restrictions
				_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "GET", param).always(function(data){
					if(data){
						designRestrictions = JSON.parse(JSON.parse(data));
						param.type = "get_fav_designoption";
					}	

					var shoppingCartLines = self.application.getCart().get("lines")
					//console.log('shoppingCartLines: ' + '\n' + JSON.stringify(shoppingCartLines, 'key', '\t'))
					userOptions.shoppingCartLines = shoppingCartLines;


					if(!_.isEmpty(values)){
						userOptions.designRestrictions = designRestrictions;
						userOptions.favouriteOptions = values;	
						
						if (callback){
							callback(userOptions);	
						}
					} else {
						// retrieve favourite options
						_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "GET", param).always(function(data){
							if(data && data != "" && data != "\"\""){
								favouriteOptions = JSON.parse(JSON.parse(data));
							}	
							userOptions.designRestrictions = designRestrictions;
							userOptions.favouriteOptions = favouriteOptions;
							
							if (callback){
								callback(userOptions);	
							}
						});
					}
				});
				
				
			});	

		}
	,	displayDesignOptions : function(view, userOptions){
			var options_config = userOptions.options_config
			, 	favouriteOptions = userOptions.favouriteOptions
			, 	designRestrictions = userOptions.designRestrictions
			, 	designOptions = new Object();
			var currentItemTypes;
			
			var stCartLines = JSON.stringify(userOptions.shoppingCartLines) || '[]';
			var cartLines = JSON.parse(stCartLines);
			var urlParamClientValue = _.getUrlParameterValue('client');
			var hasUrlParamClient = (!_.isNullOrEmpty(urlParamClientValue)) ? true : false;
			var orderItemInternalId = '';
			
			if (hasUrlParamClient)
			{
				var arrUrlParamClient = urlParamClientValue.split('|');
				var arrUrlParamClientTotal = (!_.isNullOrEmpty(arrUrlParamClient)) ? arrUrlParamClient.length : 0;
				if (arrUrlParamClientTotal == 2)
				{
					orderItemInternalId = arrUrlParamClient[1]
				}
			}

			//console.log('cartLines: ' + '\n' + JSON.stringify(cartLines, 'key', '\t'))
			var objCartDesignOptionsMapping = _.getObjDesignOptionsMappingFromCartId(cartLines, orderItemInternalId);
			
			console.log('objCartDesignOptionsMapping: ' + '\n' + JSON.stringify(objCartDesignOptionsMapping, 'key', '\t'))
			
			
			// console.log('options_config: ' + '\n' + JSON.stringify(options_config, 'key', '\t'))

			if (view.model.get('custitem_clothing_type') && view.model.get('custitem_clothing_type') != "" && view.model.get('custitem_clothing_type') != "nbsp;"){
				currentItemTypes = view.model.get('custitem_clothing_type').split(', ');
			}
			_.each(options_config, function(clothingType){

				if (currentItemTypes && currentItemTypes.indexOf(clothingType.item_type) >= 0){
					// iterate clothing component for each clothing type (Style and Make, Lapel, etc)
					_.each(clothingType.options, function(component){
						
						// iterate every options for each component
						_.each(component.fields, function(field){
							// find restrictions
							var currentRestriction = _.where(designRestrictions, {name: field.name}),
								currentValues = [],
								restrictions = null;

							// restrict fields to be displayed
							if (currentRestriction && currentRestriction.length > 0){
								restrictions = currentRestriction[0].value.trim().split(",");			
							}

							var currentFavouriteOption = favouriteOptions ? favouriteOptions[field.name] : "";
							
							
							//console.log('field.type: ' + field.type)
							
							/**
							if (field.type == 'text')
							{
									// instantiate if object does not exist yet
									if (!designOptions[clothingType.item_type]){
										designOptions[clothingType.item_type] = {};
									}

									designOptions[clothingType.item_type][component.label][field.label] = {
											type 	:	field.type,
											label	:	field.label,
											name	: 	field.name
									};					
							}
							**/

							// set restrictions
							for(var i = 0; i < field.values.length; i++){
								var currentFieldValue = field.values[i];
								var isFavourite = currentFieldValue == currentFavouriteOption;
								
								var isSelectType = (field.type == 'select') ? true : false;
								var isTextType = (field.type == 'text') ? true : false;
								
								if (isSelectType)
								{
									if (restrictions && restrictions != null){
										// for items with restrictions, only add options that are indicated in the config
										if (restrictions.indexOf(field.values[i]) >= 0){
											currentValues.push({
												name	:	field.texts[i],
												value	:	field.values[i],
												isFavourite : isFavourite
											});
										}
									} else {
										
										currentValues.push({
											name	:	field.texts[i],
											value	:	field.values[i],
											isFavourite : isFavourite
										});
									}
									
									// instantiate if object does not exist yet
									if (!designOptions[clothingType.item_type]){
										designOptions[clothingType.item_type] = {};
									}
									
									if (!designOptions[clothingType.item_type][component.label]){
										designOptions[clothingType.item_type][component.label] = {}
									}
									
									// set field values to be displayed
									if (currentValues.length > 0){
										designOptions[clothingType.item_type][component.label][field.label] = {
												type 	:	field.type,
												values 	:	currentValues,
												label	:	field.label,
												name	: 	field.name
										};					
									}
								}

								if (isTextType)
								{
									// instantiate if object does not exist yet
									if (!designOptions[clothingType.item_type]){
										designOptions[clothingType.item_type] = {};
									}

									designOptions[clothingType.item_type][component.label][field.label] = {
											type 	:	field.type,
											label	:	field.label,
											name	: 	field.name,
											value	: 	(_.isObjectExist(objCartDesignOptionsMapping['' + field.name + ''])) ? objCartDesignOptionsMapping['' + field.name + ''] : ''
									};					
								}

							}
						});	
					});	

				}
				
			});
			
			//console.log('xyla: ' + '\n' + JSON.stringify(designOptions, 'key', '\t'))
			
			jQuery('#clothing-details').html(SC.macros.itemDetailsDesignOptions(designOptions));
		}
	};
		
	return {

		Profile: Profile

	,	mountToApp: function (application)
		{
			var handler = function()
			{
				// Sets the getUser function for the application
				_.extend(application.getUser(), Profile, {
					application: application
					// we get this values from the configuration file
				,	useCookie: application.getConfig('recentlyViewedItems.useCookie', false)
					// initialize new instance of Facets Model to use search API
				,	facetsModel: new FacetsModel()
					// initialize the collection of items (empty)
				,	recentlyViewedItems: new FacetsModel().set('items',[])
				,	numberOfItemsDisplayed: application.getConfig('recentlyViewedItems.numberOfItemsDisplayed')
				});
				
				application.getLayout().on('afterAppendView', function (view)
				{
					if (view.$('[data-type="recently-viewed-placeholder"]').length)
					{
						application.getUser().renderRecentlyViewedItems(view);
					}
					// only include userOptions when on product details page
					if(!_.isEmpty(window.tempOptions) && application.getLayout().currentView.template == "product_details" && !view.inModal){
						designOptionMessage = window.tempOptionsNotes ? window.tempOptionsNotes : "";
						application.getUser().setUserOptionConfig(function(userOptions){
							application.getUser().displayDesignOptions(view, userOptions);
							jQuery("#designoption-message").val(designOptionMessage);	
						}, window.tempOptions);
					} else if (application.getLayout().currentView.template == "product_details" && view.model && view.model.get('custitem_clothing_type')){
						var values = new Object();

						if(application.getLayout().currentView.productList && application.getLayout().currentView.productList.indexOf("item") < 0){
							application.productListsInstancePromise.done(function(){
								var productList = application.getLayout().currentView.application.productListsInstance.get(application.getLayout().currentView.productList).get("items"),
									itemID = application.getLayout().currentView.model.get("internalid").toString(),
									listId = application.getLayout().currentView.itemList,
									designOptionMessage = window.tempOptionsNotes ? window.tempOptionsNotes : "";							
								if(productList){
									productList.each(function(item){
										if(item.get("item").internalid == itemID || item.get("internalid") == listId){ //If option internal ID is equal to selected list ID
											
											if(item.get("options").custcol_designoptions_jacket){
												var opValues = JSON.parse(item.get("options").custcol_designoptions_jacket.value);

												_.each(opValues, function(value){
													if(value){
														values[value.name] = value.value;
													}
												});
											}
											if(item.get("options").custcol_designoptions_trouser){
												var opValues = JSON.parse(item.get("options").custcol_designoptions_trouser.value);

												_.each(opValues, function(value){
													if(value){
														values[value.name] = value.value;
													}
												});
											}
											if(item.get("options").custcol_designoptions_waistcoat){
												var opValues = JSON.parse(item.get("options").custcol_designoptions_waistcoat.value);

												_.each(opValues, function(value){
													if(value){
														values[value.name] = value.value;
													}
												});
											}
											if(item.get("options").custcol_designoptions_shirt){
												var opValues = JSON.parse(item.get("options").custcol_designoptions_shirt.value);

												_.each(opValues, function(value){
													if(value){
														values[value.name] = value.value;
													}
												});
											}
											if(item.get("options").custcol_designoptions_overcoat){
												var opValues = JSON.parse(item.get("options").custcol_designoptions_overcoat.value);

												_.each(opValues, function(value){
													if(value){
														values[value.name] = value.value;
													}
												});
											}
											if(item.get("options").custcol_designoption_message){
												designOptionMessage = item.get("options").custcol_designoption_message.value;
											}

										}
									})
									
								}
								application.getUser().setUserOptionConfig(function(userOptions){
									application.getUser().displayDesignOptions(view, userOptions);
									jQuery("#designoption-message").val(designOptionMessage);	
								}, values);								
							});
							
						} else if(application.getLayout().currentView.productList && application.getLayout().currentView.productList.indexOf("item") > -1) {
							var item = application.getCart().get("lines").get(application.getLayout().currentView.productList)
							
							if(!_.isUndefined(item) && _.isObject(item)){
								var options = item.get("options"),
									designOptionMessage = window.tempOptionsNotes ? window.tempOptionsNotes : "";
								if(options && options.length){
									_.each(options, function(option){
										var internalid = option.id.toLowerCase();

										if(internalid == "custcol_designoptions_jacket" || internalid == "custcol_designoptions_trouser" || internalid == "custcol_designoptions_waistcoat" || internalid == "custcol_designoptions_shirt" || internalid == "custcol_designoptions_overcoat"){
											var opValues = JSON.parse(option.value);

											_.each(opValues, function(value){
												if(value){
													values[value.name] = value.value;
												}
											});
										} else if(internalid == "custcol_designoption_message"){
											designOptionMessage = option.value;
										}
									});
								}
								application.getUser().setUserOptionConfig(function(userOptions){
									application.getUser().displayDesignOptions(view, userOptions);
									jQuery("#designoption-message").val(designOptionMessage);	
								}, values);	
							} else if (_.isUndefined(item)){ //If Item is undefined, try to load it again. This will only happen if the user decides to refresh the page.
								setTimeout(function(){
									var item = application.getCart().get("lines").get(application.getLayout().currentView.productList)
									
									if(!_.isUndefined(item) && _.isObject(item)){
										var options = item.get("options");

										if(options && options.length){
											_.each(options, function(option){
												var internalid = option.id.toLowerCase();
												if(internalid == "custcol_designoptions_jacket" || internalid == "custcol_designoptions_trouser" || internalid == "custcol_designoptions_waistcoat" || internalid == "custcol_designoptions_shirt" || internalid == "custcol_designoptions_overcoat"){
													var opValues = JSON.parse(option.value);

													_.each(opValues, function(value){
														if(value){
															values[value.name] = value.value;
														}
													});
												} else if(internalid == "custcol_designoption_message"){
													designOptionMessage = option.value;
												} else if(internalid == "custcol_fabric_quantity") {
													jQuery("input#quantity").val(option.value);
												} else if(internalid == "custcol_fitprofile_message") {
													jQuery("#fitprofile-message").val(option.value);
												} else if(internalid == "custcol_fitprofile_summary"){
													
													var opValues = JSON.parse(option.value);
													_.each(opValues, function(value){
														jQuery("#profiles-options-" + value.name + " option").filter(function() {
															return this.text == value.value; 
														}).attr('selected', true);
														jQuery("#profiles-options-" + value.name).trigger("change");
													});
												}
											});
										}
										application.getUser().setUserOptionConfig(function(userOptions){
											application.getUser().displayDesignOptions(view, userOptions);
											jQuery("#designoption-message").val(designOptionMessage);	
										}, values);	
									}
								}, 1000);
							}
							
						} else {
							application.getUser().setUserOptionConfig(function(userOptions){
								application.getUser().displayDesignOptions(view, userOptions);	
							}, values);

						}
					}
				});	
			};
			if (application.getUserPromise)
			{
				application.getUserPromise().done(handler); 
			}
			else
			{
				handler();
			}
		}
	};
});