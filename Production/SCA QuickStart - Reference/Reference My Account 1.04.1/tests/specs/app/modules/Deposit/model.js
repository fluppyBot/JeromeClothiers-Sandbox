/*jshint laxcomma:true*/
define(['Deposit', 'OrderPaymentmethod.Collection', 'Invoice.Collection', 'jasmineTypeCheck'],
	function (DepositModule, OrderPaymentmethodCollection, InvoiceCollection)
{
	'use strict';

	return describe('Deposit Model', function ()
	{
		describe('Initialization', function ()
		{
			it ('should attach on property lists changes', function ()
			{
				var model = new DepositModule.Model();

				//model.set('paymentmethods', []);
				//model.set('invoices', []);

				expect(model.get('paymentmethods')).toBeA(OrderPaymentmethodCollection);
				expect(model.get('invoices')).toBeA(InvoiceCollection);
			});
		});
	});
});