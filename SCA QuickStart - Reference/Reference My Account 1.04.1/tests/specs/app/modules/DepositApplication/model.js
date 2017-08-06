/*jshint laxcomma:true*/
define(['DepositApplication','Invoice.Collection','jasmineTypeCheck'],
	function (DepositApplicationModule, InvoiceCollection)
{
	'use strict';

	return describe('DepositApplication Model', function ()
	{
		describe('Initialization', function ()
		{
			it ('should attach on property lists changes', function ()
			{
				var model = new DepositApplicationModule.Model();

				model.set('invoices', []);

				expect(model.get('invoices')).toBeA(InvoiceCollection);
			});
		});
	});
});