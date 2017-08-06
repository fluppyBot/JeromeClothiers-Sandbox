/*jshint laxcomma:true*/
define(['PaymentWizard.Module.Invoice', 'PaymentWizard.Router', 'Invoice', 'LivePayment.Model', 'Invoice.OpenList.View', 'Application', 'Utils'], function (ModuleInvoiceView, Router, Invoice, LivePaymentModel, InvoiceOpenListView)
{
	'use strict';

	return describe('Payment Wizard Invoice', function ()
	{
		var view
		,	application
		,	user_invoices
		,	live_payment_model
		,	invoices_list = [
				{
					dueinmilliseconds: -1
				,	id: 1
				,	tranid: '22'
				,	amountremaining: 100.7
				,	due: 2
				}
			,	{
					dueinmilliseconds: 10
				,	id: 2
				,	tranid: '21'
				,	amountremaining: 100.1
				,	due: 33
				}
			,	{
					dueinmilliseconds: 100
				,	id: 3
				,	tranid: '20'
				,	amountremaining: 143.6
				,	due: 4
				}
			];

		// view object definition and initialization
		beforeEach(function ()
		{
			runs(function ()
			{
				// Here is the appliaction we will be using for this tests
				application = SC.Application('MyAccount');

				live_payment_model = new LivePaymentModel({}, {application: application});
				application.getLivePayment = function() 
				{
					return live_payment_model;
				}; 
				//I must instanciate the application and its name must by 'MyAccount', and only then require MyAccountConfiguration
				require(['MyAccountConfiguration']);
			
				user_invoices = new Invoice.InvoiceCollection();
				//application.getUser().set('invoices', user_invoices);

				live_payment_model.set('user_invoices', [], {silent: true});
				live_payment_model.set('invoices', invoices_list);

				view = new ModuleInvoiceView({
					wizard: new Router(application, {
						profile: application.getUser()
					,	model: live_payment_model
					})
				});
			});
		});

		// Choosing Invoices
		//------------------------------------------
		describe('Choosing Invoices', function ()
		{
			var model = null;

			beforeEach(function ()
			{
				spyOn(view, '_render');

				model = view.wizard.model;
			});

			describe('selectInvoice', function ()
			{
				it('marks it as checked', function ()
				{
					var invoice_id = 2
					,	invoice = view.invoices.get(invoice_id);
					
					expect(invoice.get('checked')).toBeFalsy();

					view.toggleInvoice(invoice_id);

					expect(invoice.get('checked')).toBe(true);
				});

				it('and adds it to the wizard model', function ()
				{
					var invoice_id = 1
					,	invoice = view.invoices.get(invoice_id);

					expect(model.get('invoices').contains(invoice)).toBe(true);

					view.toggleInvoice(invoice_id);

					expect(model.get('invoices').contains(invoice)).toBe(true);
				});

				it('only if it finds it', function ()
				{
					var invoice_id = 5
					,	invoice = view.invoices.get(invoice_id);

					view.toggleInvoice(invoice_id);

					expect(model.get('invoices').contains(invoice)).toBe(false);
				});

				it('re renders the view', function ()
				{
					view.toggleInvoice(3);

					var selected_invoices_length = view.wizard.model.get('invoices').filter(function(inv)
						{
							return inv.get('checked');
						}).length;
					expect(selected_invoices_length).toBe(1);
				});

				it('unless is silent', function ()
				{
					view.toggleInvoice(3, {silent: true});

					expect(view._render).not.toHaveBeenCalled();
				});

				it('or there\'s no invoice', function ()
				{
					view.toggleInvoice();
					view.toggleInvoice('');
					view.toggleInvoice([]);
					view.toggleInvoice(123);

					expect(view._render).not.toHaveBeenCalled();
				});
			});

			describe('unselectInvoice', function ()
			{
				beforeEach(function ()
				{
					view.toggleInvoice(1);
					view.toggleInvoice(2);
					view.toggleInvoice(3);
				});

				it('unchecks the invoice', function ()
				{
					var invoice_id = 2
					,	invoice = view.invoices.get(invoice_id);

					expect(invoice.get('apply')).toBe(true);

					view.toggleInvoice(invoice_id);

					expect(invoice.get('apply')).toBe(false);
				});

				it('removes it from the wizard model', function ()
				{
					var invoice_id = 1
					,	invoice = view.invoices.get(invoice_id);

					expect(model.get('invoices').contains(invoice)).toBe(true);

					view.toggleInvoice(invoice_id);

					expect(model.get('invoices').contains(invoice)).toBe(true);
				});

				it('and re renders the view', function ()
				{
					var q = view.wizard.model.get('invoices').length;
					view.toggleInvoice(3);

					var selected_invoices_length = view.wizard.model.get('invoices').filter(function(inv)
						{
							return inv.get('checked');
						}).length;

					expect(selected_invoices_length).toBe(q-1);
				});

				it('unless is silent', function ()
				{
					view.toggleInvoice(3);

					expect(view._render).not.toHaveBeenCalled();
				});

				it('or there\'s no invoice', function ()
				{
					view.toggleInvoice();
					view.toggleInvoice('');
					view.toggleInvoice([]);
					view.toggleInvoice(123);

					expect(view._render).not.toHaveBeenCalled();
				});
			});

			describe('toggleInvoice', function ()
			{
				it('selects the invoice if its not selected', function ()
				{
					var invoice_id = 3
					,	invoice = view.invoices.get(invoice_id);

					spyOn(view, 'selectInvoice');

					view.toggleInvoice(invoice_id);

					expect(view.selectInvoice).toHaveBeenCalled();
				});
				
				it('unselects it if it is', function ()
				{
					var invoice_id = 1
					,	invoice = view.invoices.get(invoice_id);

					spyOn(view, 'unselectInvoice');

					view.toggleInvoice(invoice_id);
					view.toggleInvoice(invoice_id);

					expect(view.unselectInvoice).toHaveBeenCalled();
				});
				
				it('as long as there is an invoice', function ()
				{
					var invoice_id = 32
					,	invoice = view.invoices.get(invoice_id);

					spyOn(view, 'selectInvoice');
					spyOn(view, 'unselectInvoice');

					view.toggleInvoice();
					view.toggleInvoice('');
					view.toggleInvoice([]);
					view.toggleInvoice(123);

					expect(view.unselectInvoice).not.toHaveBeenCalled();
					expect(view.selectInvoice).not.toHaveBeenCalled();
				});
			});

			describe('selectAll', function ()
			{
				beforeEach(function ()
				{
					view.filterInvoices = view.invoices.clone();
				});

				it('selects all invoices', function ()
				{
					var invoices_to_pay = model.get('invoices');

					expect(invoices_to_pay.isEmpty()).toBe(false);

					view.selectAll();

					expect(invoices_to_pay.length).toEqual(view.filterInvoices.length);

					view.filterInvoices.each(function (invoice)
					{
						expect(invoice.get('checked')).toBe(true);
						expect(invoices_to_pay.contains(invoice)).toBe(true);
					});
				});

				it('and re renders', function ()
				{
					view.selectAll();

					expect(view.invoices.length).toBe(view.wizard.model.get('invoices').length);
				});
			});

			describe('unselectAll', function ()
			{
				beforeEach(function ()
				{
					view.filterInvoices = view.invoices.clone();
					view.selectAll();
				});

				it('unselects all invoices', function ()
				{
					var invoices_to_pay = model.get('invoices');

					expect(invoices_to_pay.length).toEqual(view.filterInvoices.length);

					view.unselectAll();

					expect(invoices_to_pay.isEmpty()).toBe(false);

					view.filterInvoices.each(function (invoice)
					{
						expect(invoice.get('checked')).toBe(false);
						expect(invoices_to_pay.contains(invoice)).toBe(true);
					});
				});

				it('and re renders', function ()
				{
					view.unselectAll();

					expect(view.wizard.model.get('invoices').length).toBe(3);
				});
			});

		});

		// Issue: 285648 Reference My Account -> Billing -> Make a Payment (Step 1: Select invoices to pay): "Unselect All X" check box don´t work correctly  
		it('Issue: 285648', function ()
		{
			var InvoiceCollection = new Invoice.InvoiceCollection(invoices_list);
			var invoiceOpenList = new InvoiceOpenListView({ application: application, collection: new Invoice.InvoiceCollection(invoices_list) });
			invoiceOpenList.selectInvoice(InvoiceCollection.get(1));

			view.selectAll();
			expect(view.invoices.filter(function(inv) {return !inv.get('checked');}).length).toBe(0);

		});
	});
});
