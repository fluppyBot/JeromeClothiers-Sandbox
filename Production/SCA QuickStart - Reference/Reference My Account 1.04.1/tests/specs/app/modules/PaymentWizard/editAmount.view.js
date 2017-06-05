/*global it:false, SC:false, describe:false, jasmine:false, jasmine:false, define:false, expect:false, spyOn: false, jQuery:false, _:false  */
/*jshint evil:true, forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, browser:true, quotmark:single, maxerr:50, laxcomma:true, expr:true*/
define(['PaymentWizard.EditAmount.View', 'Invoice.Model', 'Application'], function (View, InvoiceModel)
{
	'use strict';

	return describe('Payment Wizard Edit Amount View', function ()
	{
		// initial setup required for this test: we will be working with views.
		// some of these tests require that some macros are loaded, so we load them all:
		jQuery.ajax({url: '../../../../../templates/Templates.php', async: false}).done(function(data)
		{
			eval(data);
			SC.compileMacros(SC.templates.macros);
		});

		var application = SC.Application('MyAccount')
		,	invoice_data = {
				refnum: '123'
			,	amount: 120
			,	due: 120
			}
		,	fake_parent_view = {}
		,	fake_options = {
				parentView: fake_parent_view
			,	application: application
			,	type: 'invoice'
		};

		describe('render - output', function ()
		{
			it ('should return a warning message indicating that discount is only available for full payment', function()
			{
				invoice_data.discountapplies = true;
				fake_options.model =  new InvoiceModel(invoice_data);

				var myView = new View(fake_options);
				myView.render();

				expect(myView.$el).toBeDefined();
				expect(myView.$('.discountWarning').is(':visible')).toEqual(false);

				myView.$('[type="text"]').val(10);
				myView.$('[type="text"]').change();

				expect(myView.$('.discountWarning').is(':visible')).toEqual(false);
			});

			it('should not call the parent view if the specified amount is not valid', function()
			{
				invoice_data.discountapplies = true;
				fake_options.model =  new InvoiceModel(invoice_data);

				var myView = new View(fake_options);
				myView.render();
				myView.$('[type="text"]').val('invalid input');
				myView.$('[type="text"]').change();

				myView.parentView.wizard = {
					model:fake_options.model
				};
				myView.parentView.wizard.model.calculeTotal = function () {return true;};

				myView.$('form').submit();

				expect(fake_options.model.get('amount_formatted')).toBeUndefined();
				expect(fake_options.model.isValid()).toEqual(false);
			});

			it('should notify the parent view and close itself when submitting a valid value', function()
			{

				invoice_data.discountapplies = true;
				invoice_data.duewithdiscount = 100;
				fake_options.model =  new InvoiceModel(invoice_data);
				var fake_distributeCredits = jasmine.createSpy('fake distributeCredits');
				fake_options.parentView.wizard = {
					model : {
							distributeCredits: fake_distributeCredits
						,	calculeTotal: function() {return 1000;}
					}
				};

				var myView = new View(fake_options)
				,	fake_modal = jasmine.createSpy('fake modal');
				myView.$containerModal = {
					modal: fake_modal
				};

				myView.render();
				myView.$('[type="text"]').val('100');
				myView.$('[type="text"]').change();

				spyOn(myView, 'destroy');

				myView.$('form').submit();

				expect(fake_options.model.get('amount_formatted')).toEqual(_.formatCurrency('100'));
				expect(fake_options.model.isValid()).toEqual(true);
				expect(fake_distributeCredits).toHaveBeenCalled();
				expect(myView.destroy).toHaveBeenCalled();
				expect(fake_modal).toHaveBeenCalled();


			});

		});
	});
});