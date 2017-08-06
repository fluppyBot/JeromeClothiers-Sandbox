/*global runs:false, afterEach:false, it:false, describe:false, define:false, expect:false, beforeEach:false, jQuery:false, waitsFor:false */
/*jshint forin:true, evil:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, browser:true, quotmark:single, maxerr:50, laxcomma:true, expr:true*/

define(['OrderWizard.Router', 'OrderWizard.Module.MultiShipTo.NonShippableItems', './orderwizard.HelperTest'],
	function (OrderWizardRouter, module, TestHelper)
{
	'use strict';

	describe('OrderWizard MultiShipTo NonShippable Items', function ()
	{
		var steps =  [
				{
					name: 'Step Group 1'
				,	steps: [
						{
							name: 'Step 1'
						,	url: 'step/1/1'
						,	modules: [
								'OrderWizard.Module.MultiShipTo.NonShippableItems'
							]
						}
					]
				}
			]
		,	helper = new TestHelper(steps, 'twoItemsWithOneShippable');
		helper.initialize();

		beforeEach(function ()
		{
			runs(function ()
			{
				helper.beforeEach();
			});

			// Makes sure the application is started before continue
			waitsFor(function ()
			{
				return helper.isBeforeEachReady();
			});
		});

		afterEach(function ()
		{
			helper.afterEach();
		});

		describe('UI Interaction', function ()
		{
			it('should render a list of non shippable items if the order has not shippable items', function ()
			{
				var wizard
				,	view_rendered =  false;

				runs(function ()
				{
					helper.application.Configuration.siteSettings.isMultiShippingRoutesEnabled = true;
					wizard = new OrderWizardRouter(helper.application, helper.wizardOptions);
					wizard.startWizard();
				});

				helper.application.getLayout().once('afterAppendView', function ()
				{
					setTimeout(function ()
					{
						view_rendered = true;
					}, 1);
				});

				waitsFor(function ()
				{
					return view_rendered;
				});

				runs(function ()
				{
					var non_shippable_item = wizard.model.get('lines').find(function (line)
					{
						return !line.get('isshippable');
					});
					expect(jQuery('[data-type="nonshippable-items-accordion"]').length).toBe(1);
					expect(jQuery('.multishipto-item-table-row').length).toBe(1);

					expect(jQuery('.multishipto-item-table-row').first().data('id')).toBe(non_shippable_item.id);
				});
			});

			it('should render empty if the order has not shippable items', function ()
			{
				var wizard
				,	view_rendered =  false;

				runs(function ()
				{
					helper.application.Configuration.siteSettings.isMultiShippingRoutesEnabled = true;
					wizard = new OrderWizardRouter(helper.application, helper.wizardOptions);

					wizard.model.get('lines').each(function (line)
					{
						line.set('isshippable', true);
					});

					wizard.startWizard();
				});

				helper.application.getLayout().once('afterAppendView', function ()
				{
					setTimeout(function ()
					{
						view_rendered = true;
					}, 1);
				});

				waitsFor(function ()
				{
					return view_rendered;
				});

				runs(function ()
				{
					expect(jQuery('[data-type="nonshippable-items-accordion"]').length).toBe(0);
				});
			});
		});
	});
});