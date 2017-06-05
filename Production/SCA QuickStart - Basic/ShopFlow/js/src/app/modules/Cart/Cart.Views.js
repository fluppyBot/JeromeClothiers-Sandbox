// Cart.Views.js
// -------------
// Cart and Cart Confirmation views
define('Cart.Views', ['ErrorManagement', 'FitProfile.Model', 'ItemDetails.Model'], function (ErrorManagement, FitProfileModel, ItemDetailsModel)
{
	'use strict';

	var Views = {}
	,	colapsibles_states = {};

	// Views.Detailed:
	// This is the Shopping Cart view
	Views.Detailed = Backbone.View.extend({

		template: 'shopping_cart'

	,	title: _('Shopping Cart').translate()

	,	page_header: _('Shopping Cart').translate()

	,	attributes: {
			'id': 'shopping-cart'
		,	'class': 'view shopping-cart'
		}

	,	events: {
			'change [name="quantity"]': 'updateItemQuantity'
		,	'keyup [name="quantity"]': 'updateItemQuantity'
		,	'submit [data-action="update-quantity"]': 'updateItemQuantityFormSubmit'

		,	'click [data-action="remove-item"]': 'removeItem'

		,	'submit form[data-action="apply-promocode"]': 'applyPromocode'
		,	'click [data-action="remove-promocode"]': 'removePromocode'

		,	'submit form[data-action="estimate-tax-ship"]': 'estimateTaxShip'
		,	'click [data-action="remove-shipping-address"]': 'removeShippingAddress'
		,	'change [data-action="estimate-tax-ship-country"]': 'changeCountry'
		,	'click [name="custcol_avt_hold_fabric"]': 'swxSetHoldFabricClick'
		,	'click [name="custcol_avt_hold_production"]': 'swxSetHoldProductionClick'

		,	'blur [name="custcol_avt_date_needed"]': 'swxSetDateNeeded'
		//,	'keyup [name="custcol_avt_date_needed"]': 'swxSetDateNeeded'
		,	'submit [data-action="update-dateneeded"]': 'swxSetDateNeededFormSubmit'

		,	'click [id="swx-butt-save-for-later-filter"]': 'swxFilterSaveForLaterClick'
		,	'click [id="swx-butt-save-for-later-filter-clear"]': 'swxFilterSaveForLaterClearClick'
		,	'click [data-action="copy-to-cart"]' : 'copyItemToCartHandler'


		}

	,	initialize: function (options)
		{
			this.application = options.application;
			this.profileInstance = new FitProfileModel(SC._applications.Shopping.getUser().get("internalid")); // April CSD Issue #046

			this.options = options;
			this.sflMode = options.sflMode;
			this.addToCartCallback = options.addToCartCallback;


			this.model.set('swx_filter_save_for_later_client', '');
		}

		// showContent:
		// initializes tooltips.
		// TODO: NOT NECESARY WITH LATEST VERSION OF BOOTSTRAP
		// calls the layout's default show content method
	,	showContent: function ()
		{
			var self = this;

			this.client_collection = this.profileInstance.client_collection; // April CSD Issue #046

			//var orderLines = this.model.get("lines");
			//console.log('Cart.Views.js >> showContent >> orderLines: ' + '\n' + JSON.stringify(orderLines, 'key', '\t'))

			var dateRef = new Date();
			var urlDesignOptions = _.getAbsoluteUrl('js/DesignOptions_Config.json') + '?t=' + dateRef.getTime();

			//jQuery.get(_.getAbsoluteUrl('js/DesignOptions_Config.json')).done(function(data){
			jQuery.get(urlDesignOptions).done(function(data){
				if (data){
					self.renderLineItemOptions(JSON.parse(data), self);
				}

				// April CSD Issue #046
				setTimeout(function(){
					self.downloadQuote();
					return self.application.getLayout().showContent(self, true).done(function (view)
						{
							self.renderRelatedAndCorrelatedItemsHelper(view);
						});
				}, 1000)
			});

			var optionData = this.model.get("options");
			optionData.custbody_avt_wbs_hold_date_needed_json = '';
			this.model.set("options", optionData);




		}
	,	renderLineItemOptions : function(designOptionsConfig, view){
			var CONSTANTS = {
					DESIGNOPTIONS 	: 'custcol_designoptions_',
					FITPROFILE		: 'custcol_fitprofile_'
			}

			var stItemId = '';

			var DESIGNOPTIONMESSAGE = CONSTANTS.DESIGNOPTIONS.substr(0, CONSTANTS.DESIGNOPTIONS.length - 2) + "_message"; // removes the "S" in designoptions
			_.each(view.model.get('lines').models, function (line, index){
				var itemOptions = line.get('item').itemOptions;

				var designOptions = []; // for selected options
				// iterate through all item Options
				for (var item_id in itemOptions){

					stItemId += item_id + '\n';

					if (item_id == DESIGNOPTIONMESSAGE){
						line.set('designOptionsNotes', itemOptions[item_id].label);
					} else if (item_id == CONSTANTS.FITPROFILE + "message"){
						line.set('fitProfileNotes', itemOptions[item_id].label);
					} else if (typeof itemOptions[item_id] === 'object'){

						if (item_id.indexOf(CONSTANTS.DESIGNOPTIONS) >= 0){ // handling design options

							/**
							var selections = [];
							var clothType = item_id.replace(CONSTANTS.DESIGNOPTIONS, ""); // removes the custcol_designoptions prefix to get the clothType
							clothType = clothType.charAt(0).toUpperCase() + clothType.slice(1); // capitalize string
							var currentItemSelectedOptions = JSON.parse(itemOptions[item_id].label);
							for (var index in currentItemSelectedOptions){
								var currentSelectedOption = currentItemSelectedOptions[index];
								for (var clothingIndex in designOptionsConfig){
									var currentCloth = designOptionsConfig[clothingIndex];
									if (currentCloth.item_type == clothType){
										for (var optionsIndex in currentCloth.options){
											var currentOptions = currentCloth.options[optionsIndex];
											for (var fieldIndex in currentOptions.fields){
												var currentField = currentOptions.fields[fieldIndex];
												if (currentField.name == currentSelectedOption.name){
													for (var valueIndex in currentField.values){
														var currentValue = currentField.values[valueIndex];
														if (currentValue == currentSelectedOption.value){
															selections.push(
																	{ 	"name" 	: currentField.label,
																		"value"	: currentField.texts[valueIndex]
																	});
															break;
														}
													}
												};
											}
										}
									}
								}
							}
							designOptions.push({
								header: clothType,
								selections : selections
							})
							**/

							/** start D.A. debug **/

							var selections = [];
							var clothType = item_id.replace(CONSTANTS.DESIGNOPTIONS, ""); // removes the custcol_designoptions prefix to get the clothType
							clothType = clothType.charAt(0).toUpperCase() + clothType.slice(1); // capitalize string
							var currentItemSelectedOptions = JSON.parse(itemOptions[item_id].label);

							//console.log('currentItemSelectedOptions: ' + '\n' + JSON.stringify(currentItemSelectedOptions, 'key', '\t'))

							for (var index in currentItemSelectedOptions){
								var currentSelectedOption = currentItemSelectedOptions[index];
								for (var clothingIndex in designOptionsConfig){
									var currentCloth = designOptionsConfig[clothingIndex];
									if (currentCloth.item_type == clothType){
										for (var optionsIndex in currentCloth.options){
											var currentOptions = currentCloth.options[optionsIndex];
											for (var fieldIndex in currentOptions.fields){
												var currentField = currentOptions.fields[fieldIndex];

												if (currentField.name == currentSelectedOption.name){

													//console.log('currentField.type: ' + currentField.type)

													var isTypeSelect = (currentField.type == 'select') ? true : false;
													var isTypeText = (currentField.type == 'text') ? true : false;

													if (isTypeSelect)
													{
														for (var valueIndex in currentField.values){
															var currentValue = currentField.values[valueIndex];
															if (currentValue == currentSelectedOption.value){
																selections.push(
																		{ 	"name" 	: currentField.label,
																			"value"	: currentField.texts[valueIndex]
																		});
																break;
															}
														}
													}

													if (isTypeText)
													{
														selections.push(
																{ 	"name" 	: currentField.label,
																	"value"	: currentSelectedOption.value
																});

													}


												};
											}
										}
									}
								}
							}
							designOptions.push({
								header: clothType,
								selections : selections
							})

							//console.log('designOptions: ' + '\n' + JSON.stringify(designOptions, 'key', '\t'))

							/** end D.A. debug **/


						} else if (item_id == CONSTANTS.FITPROFILE + "summary"){  // handling fit profile
							line.set('fitProfileOptions', JSON.parse(itemOptions[item_id].label));
						}
					}
				}

				line.set('designOptions', designOptions);

			});
		}


	,	swxFilterSaveForLaterClick: function (e)
		{
			e.preventDefault();
			var self = this;
			var $target = jQuery(e.target);
			console.log('swxFilterSaveForLaterClick');

			var stFilterSaveForLaterValue = jQuery("[id='swx_filter_save_for_later_client']").val();

			this.model.set('swx_filter_save_for_later_client', jQuery.trim(stFilterSaveForLaterValue));

			// disable inputs and buttons
			$target.find('input, button').prop('disabled', true);

			this.model.save().success(
				function ()
				{
					self.showContent();
				}
			).error(
				function (jqXhr)
				{

				}
			).always(
				function ()
				{
					// enable inputs and buttons
					$target.find('input, button').prop('disabled', false);
				}
			);
		}

	,	swxFilterSaveForLaterClearClick: function (e)
		{
			e.preventDefault();
			var self = this;
			var $target = jQuery(e.target);
			console.log('swxFilterSaveForLaterClearClick');

			var stFilterSaveForLaterValue = '';

			this.model.set('swx_filter_save_for_later_client', stFilterSaveForLaterValue);

			// disable inputs and buttons
			$target.find('input, button').prop('disabled', true);

			this.model.save().success(
				function ()
				{
					self.showContent();
				}
			).error(
				function (jqXhr)
				{

				}
			).always(
				function ()
				{
					// enable inputs and buttons
					$target.find('input, button').prop('disabled', false);
				}
			);
		}

	,	swxSetHoldFabricClick: function (e)
		{
			e.preventDefault();
			var checkBoxName = 'custcol_avt_hold_fabric';
			var self = this
			,	$line = null
			,	options = jQuery(e.target).closest('form').serializeObject()
			,	line = this.model.get('lines').get(options.internalid);

			if (!line)
			{
				return;
			}

			var	$input = jQuery(e.target).closest('form').find('[name="' + checkBoxName + '"]');
			var isCheckBoxChecked = $input.is(":checked");
			var	checkBoxValue = (isCheckBoxChecked) ? 'T' : 'F';

			this.storeColapsiblesState();
			var stLine = JSON.stringify(line);
			var objLine = JSON.parse(stLine) || {};
			var objOptions = objLine['options'];
			for (var dx in objOptions)
			{
				if (dx == checkBoxName)
				{
					objOptions[dx] = checkBoxValue
				}
			}
			line.set('options', objOptions);

			this.model.updateLine(line).success(function ()
			{
				self.showContent()
			}).error(function (jqXhr)
				{
					jqXhr.preventDefault = true;
					var result = JSON.parse(jqXhr.responseText);

					self.showError(result.errorMessage, $line, result.errorDetails);
				}
			).always(function ()
				{
					$input.prop('disabled', false);
				}
			);
		}


	,	swxSetHoldProductionClick: function (e)
		{
			e.preventDefault();
			var checkBoxName = 'custcol_avt_hold_production';
			var self = this
			,	$line = null
			,	options = jQuery(e.target).closest('form').serializeObject()
			,	line = this.model.get('lines').get(options.internalid);

			if (!line)
			{
				return;
			}

			var	$input = jQuery(e.target).closest('form').find('[name="' + checkBoxName + '"]');
			var isCheckBoxChecked = $input.is(":checked");
			var	checkBoxValue = (isCheckBoxChecked) ? 'T' : 'F';

			this.storeColapsiblesState();
			var stLine = JSON.stringify(line);
			var objLine = JSON.parse(stLine) || {};
			var objOptions = objLine['options'];
			for (var dx in objOptions)
			{
				if (dx == checkBoxName)
				{
					objOptions[dx] = checkBoxValue
				}
			}
			line.set('options', objOptions);

			this.model.updateLine(line).success(function ()
			{
				self.showContent()
			}).error(function (jqXhr)
				{
					jqXhr.preventDefault = true;
					var result = JSON.parse(jqXhr.responseText);

					self.showError(result.errorMessage, $line, result.errorDetails);
				}
			).always(function ()
				{
					$input.prop('disabled', false);
				}
			);
		}


	,	swxSetDateNeeded: _.throttle(function (e)
		{
			e.preventDefault();

			console.log('swxSetDateNeeded');

			var defaultDateNeeded = '1/1/1900';
			var stDateValue = '';
			var self = this
			,	$line = null
			,	options = jQuery(e.target).closest('form').serializeObject()
			,	line = this.model.get('lines').get(options.internalid);

			if (!line)
			{
				return;
			}

			var	new_date = jQuery.trim(options.custcol_avt_date_needed);
			var	$input = jQuery(e.target).closest('form').find('[name="custcol_avt_date_needed"]');

			console.log('swxSetDateNeeded >> new_date: ' + new_date);

			var isValidDate = this.validateDateNeeded(new_date);

			console.log('swxSetDateNeeded >> isValidDate: ' + isValidDate);

			if (!isValidDate)
			{
				new_date = '';
				stDateValue = defaultDateNeeded;
			}

			if (isValidDate)
			{
				var dateRef = _.stringToDate(new_date);
				console.log('swxSetDateNeeded >> dateRef: ' + dateRef);

				var stDate = dateRef.getDate();
				var stMonth = dateRef.getMonth() + 1;
				var stYear = dateRef.getFullYear();

				stDateValue = stDate + '/' + stMonth + '/' + stYear;
				//console.log('swxSetDateNeeded >> dateRef: ' + '\n' + 'stYear: ' + stYear + '\n' + 'stMonth: ' + stMonth + '\n' + 'stDate: ' + stDate );

			}

			$input.val(new_date);

			this.storeColapsiblesState();
			var stLine = JSON.stringify(line);
			var objLine = JSON.parse(stLine) || {};
			var objOptions = objLine['options'];
			for (var dx in objOptions)
			{
				if (dx == 'custcol_avt_date_needed')
				{
					//objOptions[dx] = _.stringToDate(new_date);
					objOptions[dx] = stDateValue;
				}
			}
			line.set('options', objOptions);

			this.model.updateLine(line).success(function ()
			{
				self.showContent()
			}).error(function (jqXhr)
				{
					jqXhr.preventDefault = true;
					var result = JSON.parse(jqXhr.responseText);

					self.showError(result.errorMessage, $line, result.errorDetails);
				}
			).always(function ()
				{
					$input.prop('disabled', false);
				}
			);


		}, 600, {leading:false})



	,	validateDateNeeded: function (date_needed)
		{
			var is_valid = true;
			//_.isDateValid(toMax)
			//var isDateNeededValid =

			var dateNeededRef = new Date(date_needed);

			var isDateNeededValid = _.isDateValid(dateNeededRef);

			if (isDateNeededValid)
			{
				var arrSplitDateNeeded = date_needed.split('-')
				var arrSplitDateNeededTotal = arrSplitDateNeeded.length;
				var isArrSplitDateNeededTotalEqualToThree = (arrSplitDateNeededTotal == 3) ? true : false;

				if (isArrSplitDateNeededTotalEqualToThree)
				{
					var dateToday = new Date();
					dateToday.setHours(0, 0, 0);
					dateNeededRef.setHours(0, 0, 0);

					var stDateNeededYear = dateNeededRef.getFullYear()
					var stDateNeededMonth = dateNeededRef.getMonth() + 1;
					var stDateNeededDate = dateNeededRef.getDate();
					var stDateNeeded = stDateNeededYear + '-' + stDateNeededMonth + '-' + stDateNeededDate;


					var stTodayYear = dateToday.getFullYear();
					var stTodayMonth = dateToday.getMonth() + 1;
					var stTodayDate = dateToday.getDate();
					var stDateToday = stTodayYear + '-' + stTodayMonth + '-' + stTodayDate;

					var isStDateNeededEqualToDateToday = (stDateNeeded == stDateToday) ? true : false;

					if (isStDateNeededEqualToDateToday)
					{
						is_valid = true;
					}

					if (!isStDateNeededEqualToDateToday)
					{
						var isDateTodayLessThanDateNeeded = (dateToday < dateNeededRef) ? true : false;

						if (!isDateTodayLessThanDateNeeded)
						{
							is_valid = false;
						}

					}

					console.log('dateNeededRef: ' + dateNeededRef + '\n' + 'dateToday: ' + dateToday + '\n' + 'isDateTodayLessThanDateNeeded: ' + isDateTodayLessThanDateNeeded)


				}

				if (!isArrSplitDateNeededTotalEqualToThree)
				{
					is_valid = false;
				}


				//is_valid = false;
			}


			if (!isDateNeededValid)
			{
				is_valid = false;
			}


			return is_valid;
		}

	/** start copy item **/
		// Add a particular item into the cart
	,	copyItemToCartHandler : function (e)
		{
			e.preventDefault();

			var self = this
			,	product = this.model.get('lines').get(jQuery(e.target).data('internalid'))
			,	selected_product_list_item_id = self.$(e.target).closest('article').data('id')

			var option_values = []
			var selected_options = product.get('options');

			console.log('selected_options: ' + '\n' + JSON.stringify(selected_options, 'key', '\t'))

			_.each(selected_options, function(value, key) {
				option_values.push({id: key, value: value.value, displayvalue: value.displayvalue});
			});

			console.log('option_values: ' + '\n' + JSON.stringify(option_values, 'key', '\t'))

			var selected_item = product.get('item');
			var selected_item_internalid = selected_item.get('internalid');

			console.log('selected_item_internalid: ' + selected_item_internalid)

			var item_detail = self.getItemForCart(selected_item_internalid, product.get('quantity'));

			item_detail.set('_optionsDetails', selected_item.get('itemoptions_detail'));
			item_detail.setOptionsArray(selected_options, true);
			item_detail.setOption('custcol_avt_wbs_copy_key', selected_item_internalid.toString() + '_' + new Date().getTime());


			var add_to_cart_promise = this.copyItemToCart(item_detail)
			,	whole_promise = null;

			if (this.sflMode)
			{
				//whole_promise = jQuery.when(add_to_cart_promise, this.deleteListItem(selected_product_list_item)).then(jQuery.proxy(this, 'executeAddToCartCallback'));
				whole_promise = jQuery.when(add_to_cart_promise).then(jQuery.proxy(this, 'executeAddToCartCallback'));

			}
			else
			{
				//whole_promise = jQuery.when(add_to_cart_promise).then(jQuery.proxy(this, 'showConfirmationHelper', selected_product_list_item));
			}

			if (whole_promise)
			{
				this.disableElementsOnPromise(whole_promise, 'article[data-item-id="' + selected_item_internalid + '"] a, article[data-item-id="' + selected_item_internalid + '"] button');
			}

			add_to_cart_promise.success(function ()
			{
				self.showContent()/*.done(function (view)
				{
					view.resetColapsiblesState();
				});*/
			});



		}

	,	executeAddToCartCallback: function()
		{
			if (!this.addToCartCallback)
			{
				return;
			}

			this.addToCartCallback();
		}

		// Gets the ItemDetailsModel for the cart
	,	getItemForCart: function (id, qty, opts)
		{
			return new ItemDetailsModel({
				internalid: id
			,	quantity: qty
			,	options: opts
			});
		}



		// Adds the item to the cart
	,	copyItemToCart: function (item)
		{
			//return this.cart.addItem(item);
			return this.model.addItem(item);
		}

	/** end copy item **/

	,	renderRelatedAndCorrelatedItemsHelper: function (view)
		{
			// related items
			var related_items_placeholder = view.$('[data-type="related-items-placeholder"]')
			,	application = this.application;

			view.$('[data-toggle="tooltip"]').tooltip({html: true});

			// check if there is a related items placeholders
			if (related_items_placeholder.length)
			{
				application.showRelatedItems && application.showRelatedItems(view.model.getItemsIds(), related_items_placeholder);
			}

			// correlated items
			var correlated_items_placeholder = view.$('[data-type="correlated-items-placeholder"]');
			// check if there is a related items placeholders
			if (correlated_items_placeholder.length)
			{
				application.showRelatedItems && application.showCorrelatedItems(view.model.getItemsIds(), correlated_items_placeholder);
			}
		}

	,	hideError: function (selector)
		{
			var el = (selector)? selector.find('[data-type="alert-placeholder"]') : this.$('[data-type="alert-placeholder"]');
			el.empty();
		}

	,	showError: function (message, line, error_details)
		{
			var placeholder;

			this.hideError();

			if (line)
			{
				// if we detect its a rolled back item, (this i an item that was deleted
				// but the new options were not valid and was added back to it original state)
				// We will move all the references to the new line id
				if (error_details && error_details.status === 'LINE_ROLLBACK')
				{
					var new_line_id = error_details.newLineId;

					line.attr('id', new_line_id);

					line.find('[name="internalid"]').attr({
						id: 'update-internalid-' + new_line_id
					,	value: new_line_id
					});
				}

				placeholder = line.find('[data-type="alert-placeholder"]');
				this.hideError(line);
			}
			else
			{
				placeholder = this.$('[data-type="alert-placeholder"]');
				this.hideError();
			}

			// Finds or create the placeholder for the error message
			if (!placeholder.length)
			{
				placeholder = jQuery('<div/>', {'data-type': 'alert-placeholder'});
				this.$el.prepend(placeholder);
			}

			// Renders the error message and into the placeholder
			placeholder.append(
				SC.macros.message(message, 'error', true)
			);

			// Re Enables all posible disableded buttons of the line or the entire view
			if (line)
			{
				line.find(':disabled').attr('disabled', false);
			}
			else
			{
				this.$(':disabled').attr('disabled', false);
			}
		}

		// updateItemQuantity:
		// executes on blur of the quantity input
		// Finds the item in the cart model, updates its quantity and saves the cart model
	,	updateItemQuantity: _.debounce(function (e)
		{
			e.preventDefault();

			var self = this
			,	$line = null
			,	options = jQuery(e.target).closest('form').serializeObject()
			,	line = this.model.get('lines').get(options.internalid);

			if (!line)
			{
				return;
			}

			var	new_quantity = parseInt(options.quantity, 10)
			,	current_quantity = parseInt(line.get('quantity'), 10)
			,	$input = jQuery(e.target).closest('form').find('[name="quantity"]');

			new_quantity = (new_quantity > 0) ? new_quantity : current_quantity;

			$input.val(new_quantity);

			this.storeColapsiblesState();

			if (new_quantity !==  current_quantity)
			{
				line.set('quantity', new_quantity);
				$line = this.$('#' + options.internalid);
				$input.val(new_quantity).prop('disabled', true);

				this.model.updateLine(line).success(function ()
				{
					self.showContent()
				}).error(function (jqXhr)
					{
						jqXhr.preventDefault = true;
						var result = JSON.parse(jqXhr.responseText);

						self.showError(result.errorMessage, $line, result.errorDetails);
					}
				).always(function ()
					{
						$input.prop('disabled', false);
					}
				);
			}
		}, 600)

	,	updateItemQuantityFormSubmit: function (e)
		{
			e.preventDefault();
			this.updateItemQuantity(e);
		}

	,	swxSetDateNeededFormSubmit: function (e)
		{
			e.preventDefault();
			this.swxSetDateNeeded(e);
		}

		// removeItem:
		// handles the click event of the remove button
		// removes the item from the cart model and saves it.
	,	removeItem: function (e)
		{
			// April CSD Issue #058
			var message = _("Are you sure that you want to delete this item?").translate();
			if (window.confirm(message)) {
				this.storeColapsiblesState();

				var self = this
				,	product = this.model.get('lines').get(jQuery(e.target).data('internalid'))
				,	remove_promise = this.model.removeLine(product)
				,	internalid = product.get('internalid');

				this.disableElementsOnPromise(remove_promise, 'article[id="' + internalid + '"] a, article[id="' + internalid + '"] button');

				remove_promise.success(function ()
				{
					self.showContent()/*.done(function (view)
					{
						view.resetColapsiblesState();
					});*/
				});

				return remove_promise;
			}
		}

		// validates the passed gift cert item and return false and render an error message if invalid.
		// TODO: put this logic in a more abstract/utility class.
	,	validateGiftCertificate: function (item)
		{
			if (item.itemOptions && item.itemOptions.GIFTCERTRECIPIENTEMAIL)
			{
				if (!Backbone.Validation.patterns.email.test(item.itemOptions.GIFTCERTRECIPIENTEMAIL.label))
				{
					this.render(); //for unchecking the just checked checkbox
					this.showError(_('Recipient email is invalid').translate());
					return false;
				}
			}
			return true;
		}

		// applyPromocode:
		// Handles the submit of the apply promo code form
	,	applyPromocode: function (e)
		{
			e.preventDefault();

			this.$('[data-type=promocode-error-placeholder]').empty();

			var self = this
			,	$target = jQuery(e.target)
			,	options = $target.serializeObject();

			// disable inputs and buttons
			$target.find('input, button').prop('disabled', true);

			this.model.save({
				promocode: {
					code: options.promocode
				}
			}).success(
				function ()
				{
					self.showContent();
				}
			).error(
				function (jqXhr)
				{
					self.model.unset('promocode');
					jqXhr.preventDefault = true;
					var message = ErrorManagement.parseErrorMessage(jqXhr, self.options.application.getLayout().errorMessageKeys);
					self.$('[data-type=promocode-error-placeholder]').html(SC.macros.message(message,'error',true));
					$target.find('input[name=promocode]').val('').focus();
				}
			).always(
				function ()
				{
					// enable inputs and buttons
					$target.find('input, button').prop('disabled', false);
				}
			);
		}

		// removePromocode:
		// Handles the remove promocode button
	,	removePromocode: function (e)
		{
			e.preventDefault();

			var self = this;

			this.model.save({promocode: null}, {
				success: function ()
				{
					self.showContent();
				}
			});
		}

		// estimateTaxShip
		// Sets a fake address with country and zip code based on the options.
	,	estimateTaxShip: function (e)
		{
			var model = this.model
			,	options = jQuery(e.target).serializeObject()
			,	address_internalid = options.zip + '-' + options.country + '-null';

			e.preventDefault();

			if (!options.zip)
			{
				return this.showError(_('Zip code is required.').translate());
			}

			model.get('addresses').push({
				internalid: address_internalid
			,	zip: options.zip
			,	country: options.country
			});

			model.set('shipaddress', address_internalid);

			model.save().success(jQuery.proxy(this, 'showContent'));
		}

		// removeShippingAddress:
		// sets a fake null address so it gets removed by the backend
	,	removeShippingAddress: function (e)
		{
			e.preventDefault();

			var self = this;

			this.model.save({
				shipmethod: null
			,	shipaddress: null
			}).success(function ()
			{
				self.showContent();
			});
		}

	,	changeCountry: function (e)
		{
			e.preventDefault();
			this.storeColapsiblesState();
			var options = jQuery(e.target).serializeObject();

			var AddressModel = this.model.get('addresses').model;
			this.model.get('addresses').add(new AddressModel({ country: options.country, internalid: options.country }));
			this.model.set({ shipaddress: options.country });

			this.showContent().done(function (view)
			{
				view.resetColapsiblesState();
			});

		}

	,	resetColapsiblesState: function ()
		{
			var self = this;
			_.each(colapsibles_states, function (is_in, element_selector)
			{
				self.$(element_selector)[ is_in ? 'addClass' : 'removeClass' ]('in').css('height',  is_in ? 'auto' : '0');
			});
		}

	,	storeColapsiblesState: function ()
		{
			this.storeColapsiblesStateCalled = true;
			this.$('.collapse').each(function (index, element)
			{
				colapsibles_states[SC.Utils.getFullPathForElement(element)] = jQuery(element).hasClass('in');
			});
		}
	,	downloadQuote: function ()
		{
			var self = this;
			var client_collection = this.client_collection;
			var param = new Object();
			var liveOrderDetails = new Array();
			var root = 'https://jerome.securedcheckout.com';
			var subtotal = 0;

			_.each(this.model.get('lines').models, function (line, index){
				var cartLine = new Object()
				,	clientID = _.where(line.get("options"), {id: "CUSTCOL_TAILOR_CLIENT"})[0].value
				,	tailorPricingColumn = _.where(line.get("options"), {id: "CUSTCOL_TAILOR_CUST_PRICING"})
				,	fitProfileNotesColumn = _.where(line.get("options"), {id: "CUSTCOL_FITPROFILE_MESSAGE"})
				,	displayOpNotesColumn = _.where(line.get("options"), {id: "CUSTCOL_DESIGNOPTION_MESSAGE"})
				,	quantityColumn = _.where(line.get("options"), {id: "CUSTCOL_FABRIC_QUANTITY"})
				,	displayOptionsJacket = _.where(line.get("options"), {id: "CUSTCOL_DESIGNOPTIONS_JACKET"})
				,	displayOptionsTrouser = _.where(line.get("options"), {id: "CUSTCOL_DESIGNOPTIONS_TROUSER"})
				,	displayOptionsWaistcoat = _.where(line.get("options"), {id: "CUSTCOL_DESIGNOPTIONS_WAISTCOAT"})
				,	displayOptionsOvercoat = _.where(line.get("options"), {id: "CUSTCOL_DESIGNOPTIONS_OVERCOAT"})
				,	displayOptionsShirt = _.where(line.get("options"), {id: "CUSTCOL_DESIGNOPTIONS_SHIRT"})
				,	fitProfileJacket = _.where(line.get("options"), {id: "CUSTCOL_FITPROFILE_JACKET"})
				,	fitProfileTrouser = _.where(line.get("options"), {id: "CUSTCOL_FITPROFILE_TROUSER"})
				,	fitProfileWaistcoat = _.where(line.get("options"), {id: "CUSTCOL_FITPROFILE_WAISTCOAT"})
				,	fitProfileOvercoat = _.where(line.get("options"), {id: "CUSTCOL_FITPROFILE_OVERCOAT"})
				,	fitProfileShirt = _.where(line.get("options"), {id: "CUSTCOL_FITPROFILE_SHIRT"});

				cartLine.itemName = line.get('item').get('_name');
				cartLine.internalid = line.get('item').get('internalid');

				cartLine.price =  "";
				if(!_.isUndefined(tailorPricingColumn)){
					subtotal += parseFloat(tailorPricingColumn[0].value);
					cartLine.price = _.formatCurrency(tailorPricingColumn[0].value);
				}

				cartLine.sku = line.get('item').get('_sku');

				cartLine.clientName = "";
				if(client_collection.length > 0) {
					_.each(client_collection.models, function(model){
						if(model.get("internalid") === clientID){
							cartLine.clientName = model.get("custrecord_tc_first_name") + " " + model.get("custrecord_tc_last_name");
						}
					});
				}

				cartLine.displayOptionsJacket = self.getColumnValue(displayOptionsJacket);
				cartLine.displayOptionsTrouser = self.getColumnValue(displayOptionsTrouser);
				cartLine.displayOptionsWaistcoat = self.getColumnValue(displayOptionsWaistcoat);
				cartLine.displayOptionsOvercoat = self.getColumnValue(displayOptionsOvercoat);
				cartLine.displayOptionsShirt = self.getColumnValue(displayOptionsShirt);

				cartLine.fitProfileJacket = self.getColumnValue(fitProfileJacket);
				cartLine.fitProfileTrouser = self.getColumnValue(fitProfileTrouser);
				cartLine.fitProfileWaistcoat = self.getColumnValue(fitProfileWaistcoat);
				cartLine.fitProfileOvercoat = self.getColumnValue(fitProfileOvercoat);
				cartLine.fitProfileShirt = self.getColumnValue(fitProfileShirt);

				cartLine.displayOpNotes = self.getColumnValue(displayOpNotesColumn);

				//cartLine.fitProfile = line.get('fitProfileOptions');
				cartLine.fitProfileNotes = self.getColumnValue(fitProfileNotesColumn);
				cartLine.fabricQuantity = self.getColumnValue(quantityColumn);

				liveOrderDetails.push(cartLine);
			});

			var date = new Date()
			,	day = date.getDate()
			,	month = date.getMonth() + 1
			,	year = date.getFullYear();

			var dateString = day+"/"+month+"/"+year;

			param.data = JSON.stringify({
				"id": this.application.getUser().get("internalid")
			,	"name":  this.application.getUser().get("name")
			,	"items" : liveOrderDetails
			,	"subtotal_formatted" : _.formatCurrency(subtotal)
			,	"currency_symbol" : (_.where(SC._applications.Shopping.getConfig("siteSettings").currencies, {internalid: SC.ENVIRONMENT.LOGOBRAND.cur})[0].symbol).charCodeAt(0)
			,	"dateString" : dateString
			});

			if(this.model.get('isLoggedIn') && this.model.get('lines').models.length > 0){
				_.requestUrl("customscript_ps_sl_pdf_quote", "customdeploy_ps_sl_pdf_quote", "POST", param).always(function(data){
					if(data){
						jQuery('#btn-download-pdf').attr('target', '_blank');
						jQuery('#btn-download-pdf').attr('href', root + '/app/site/hosting/scriptlet.nl?script=125&deploy=1&compid=3857857&custparam_record_id='+data);
						jQuery('#btn-download-pdf').css('display', 'block');
					}

				});
			} else {}
		}
	,	getColumnValue: function(col) {
			if(!_.isUndefined(col) && !_.isEmpty(col)){
				return col[0].value;
			} else {
				return "";
			}
		}
	});

	// Views.Confirmation:
	// Cart Confirmation Modal
	Views.Confirmation = Backbone.View.extend({

		template: 'shopping_cart_confirmation_modal'

	,	title: _('Added to Cart').translate()

	,	page_header: _('Added to Cart').translate()

	,	attributes: {
			'id': 'shopping-cart'
		,	'class': 'cart-confirmation-modal shopping-cart'
		}

	,	events: {
			'click [data-trigger=go-to-cart]': 'dismisAndGoToCart'
		}

	,	initialize: function (options)
		{
			this.line = options.model.getLatestAddition();
		}


		// dismisAndGoToCart
		// Closes the modal and calls the goToCart
	,	dismisAndGoToCart: function (e)
		{
			e.preventDefault();

			this.$containerModal.modal('hide');
			this.options.layout.goToCart();
		}
	});

	return Views;
});
