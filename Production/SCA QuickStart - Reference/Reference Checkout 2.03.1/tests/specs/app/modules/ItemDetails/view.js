/*global jasmine:false, jQuery: false, _:false, runs:false, afterEach:false, it:false, describe:false, define:false, expect:false, beforeEach:false, waitsFor:false */
/*jshint evil:true, forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, browser:true, quotmark:single, maxerr:50, laxcomma:true, expr:true*/

define(['ItemDetails.View', 'ItemDetails.Model', '../testHelperBase'],
	function (ItemDetailsView, ItemDetailsModel, TestHelper)
{
	'use strict';

	describe('Items Details View', function ()
	{
		var helper = new TestHelper({
				// NEEDED MODULES THAT ARE NOT DEFINED AS REQUIRE.JS MODULES
				requireModules: ['ItemsKeyMapping']
				// REQUIRE APPLICATION SETTINGS
			,	applicationConfiguration: {
					macros: {
						itemDetailsImage: 'itemImageGallery'
					}
				,	imageNotAvailable: _.getAbsoluteUrl('img/no_image_available.jpeg')
				,	hover_pin_it_button: {
						enable_pin_it_hover: true
					,	enable_pin_it_button: true
					,	image_size: 'main' // Select resize id to show on Pintrest
					,	popupOptions: {
							status: 'no'
						,	resizable: 'yes'
						,	scrollbars: 'yes'
						,	personalbar: 'no'
						,	directories: 'no'
						,	location: 'no'
						,	toolbar: 'no'
						,	menubar: 'no'
						,	width: '680'
						,	height: '300'
						,	left: '0'
						,	top: '0'
						}
					}
				}
			,	beforeEachReady: function ()
				{
					// WHEN BEFORE-EACH PREDONCITIONS ARE FULFILLED WE UPDATE APPLICATION AND ITEM DETAILS MODEL TO LINK WITH ITEM KEY MAPPING
					this.application.resizeImage = function () {};
					this.application.ProductListModule = {
						renderProductLists: function () {}
					};
					ItemDetailsModel.prototype.keyMapping = this.application.getConfig('itemKeyMapping', {});
				}
			})
			// VIEW TO TEST
		,	view
		,	model
		,	model_data = {'total':1,'items':[{'ispurchasable':true,'featureddescription':'','custitem_ns_pr_attributes_rating':'','showoutofstockmessage':false,'metataghtml':'','stockdescription':'','itemid':'Lithium','onlinecustomerprice':50.0,'outofstockbehavior':'- Default -','storedisplayname2':'Lithium','internalid':88,'itemimages_detail':{'urls':[{'url':'http://dev8.oloraqa.com/images/lithium.01.JPG','altimagetext':''},{'url':'http://dev8.oloraqa.com/images/lithium.02.JPG','altimagetext':''},{'url':'http://dev8.oloraqa.com/images/lithium.03.png','altimagetext':''}]},'isdonationitem':false,'pagetitle':'','onlinecustomerprice_detail':{'onlinecustomerprice_formatted':'$50.00','onlinecustomerprice':50.0},'itemtype':'InvtPart','storedetaileddescription':'','outofstockmessage':'','searchkeywords':'','isonline':true,'storedescription':'','isinactive':false,'quantityavailable':0.0,'pagetitle2':'Lithium','urlcomponent':'','custitem_ns_pr_rating_by_rate':'','displayname':'','custitem_ns_pr_item_attributes':'&nbsp;'}],'facets':[{'id':'onlinecustomerprice','values':[{'url':'62.05','label':'62.05'}],'min':62.05,'max':62.05,'ranges':[]},{'id':'category','values':[{'url':'Home','id':'Home','values':[]}]}],'corrections':[],'locale':{'country':'US','language':'en','currency':'USD','region':1},'volatility':'short','code':200};


		beforeEach(function ()
		{
			runs(function ()
			{
				helper.runBeforeEach();

				model = new ItemDetailsModel();

				// PRE-SET AJAX RESPONSES
				// jasmine.Ajax.stubRequest('/api/items?language=en&country=US&currency=USD&pricelevel=5&id=88').andReturn({ //Save and validate model
				// responseText:JSON.stringify(model_data)
				// });

				model.fetch({
					data: {id:'88'}
				,	killerId: helper.application.killerId
				});

				// OR POST-SET AJAX RESPONDSES
				var ajaxRequest = jasmine.Ajax.requests.mostRecent();
				ajaxRequest.response({
					status: 200
				,	responseText: JSON.stringify(model_data)
				});

				view = new ItemDetailsView({
					application: helper.application
				,	model: model
				});
			});

			// Makes sure the application is started before continue
			waitsFor(function ()
			{
				return helper.isBeforeEachReady();
			});
		});

		afterEach(_.bind(helper.afterEach, helper));

		it ('should retrieve and render the basic item properties', function ()
		{
			view.showContent();

			expect(jQuery.trim(jQuery('[itemprop="name"]').text())).toEqual('Lithium');
		});
	});
});