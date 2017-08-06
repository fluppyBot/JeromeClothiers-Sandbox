/*jshint laxcomma:true*/
define(['Invoice','OrderLine.Collection', 'OrderShipmethod.Collection', 'Address.Collection', 'CreditCard.Collection','OrderPaymentmethod.Collection','jasmineTypeCheck'],
	function (InvoiceModule, OrderLinesCollection, ShipmethodsCollection, AddressesCollection, CreditCardsCollection, OrderPaymentmethodCollection)
{
	'use strict';

	return describe('Invoice Module', function ()
	{
		describe('Initialization', function ()
		{
			it ('should set checked false and payment properties', function ()
			{
				var model = new InvoiceModule.Model({amountremaining: 123});

				expect(model.get('checked')).toBeFalsy();
				expect(model.get('payment')).toBeFalsy();
				expect(model.get('payment_formatted')).toBeFalsy();
			});

			it ('should attach on property lists changes', function ()
			{
				var model = new InvoiceModule.Model({amountremaining: 123});

				model.set('lines', []);
				model.set('shipmethods',[]);
				model.set('addresses',[]);
				model.set('paymentmethods',[]);

				expect(model.get('lines')).toBeA(OrderLinesCollection);
				expect(model.get('shipmethods')).toBeA(ShipmethodsCollection);
				expect(model.get('addresses')).toBeA(AddressesCollection);
				expect(model.get('paymentmethods')).toBeA(OrderPaymentmethodCollection);
			});
		});
	});
});