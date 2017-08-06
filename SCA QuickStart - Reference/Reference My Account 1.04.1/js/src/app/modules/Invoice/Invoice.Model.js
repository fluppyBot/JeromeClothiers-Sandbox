define('Invoice.Model',['OrderLine.Collection', 'OrderShipmethod.Collection', 'Address.Collection', 'CreditCard.Collection','OrderPaymentmethod.Collection','InvoicePayment.Collection', 'CreditMemo.Collection','InvoiceDepositApplication.Collection','ReturnAuthorization.Collection'],
	function (OrderLinesCollection, ShipmethodsCollection, AddressesCollection, CreditCardsCollection, OrderPaymentmethodCollection, InvoicePaymentCollection, CreditMemoCollection, InvoiceDepositApplicationCollection, ReturnAuthorizationCollection)
{
	'use strict';

	function validatePayment(value)
	{
		if (isNaN(parseFloat(value)))
		{
			return _('The amount to pay is not a valid number').translate();
		}
		if (value <= 0)
		{
			return _('The amount to apply has to be positive').translate();
		}
		/*jshint validthis:true */
		if (value > this.get('due'))
		{
			return _('The amount to pay cannot exceed the remaining').translate();
		}
	}

	return Backbone.Model.extend({

		urlRoot: 'services/receipt.ss'

	,	validation : {
			amount: { fn: validatePayment }
		}

	,	initialize: function (attributes)
		{
			this.on('change:lines', function (model, lines)
			{
				model.set('lines', new OrderLinesCollection(lines), {silent: true});
			});

			this.trigger('change:lines', this, attributes && attributes.lines || []);

			this.on('change:shipmethods', function (model, shipmethods)
			{
				model.set('shipmethods', new ShipmethodsCollection(shipmethods), {silent: true});
			});
			this.trigger('change:shipmethods', this, attributes && attributes.shipmethods || []);

			this.on('change:addresses', function (model, addresses)
			{
				model.set('addresses', new AddressesCollection(addresses), {silent: true});
			});
			this.trigger('change:addresses', this, attributes && attributes.addresses || []);

			this.on('change:paymentmethods', function (model, paymentmethods)
			{
				model.set('paymentmethods', new OrderPaymentmethodCollection(paymentmethods), {silent: true});
			});
			this.trigger('change:paymentmethods', this, attributes && attributes.paymentmethod || []);

			this.on('change:payments', function (model, payments)
			{
				model.set('payments', new InvoicePaymentCollection(payments), {silent: true});
			});
			this.trigger('change:payments', this, attributes && attributes.payments || []);

			this.on('change:credit_memos', function (model, credit_memos)
			{
				model.set('credit_memos', new CreditMemoCollection(credit_memos), {silent: true});
			});
			this.trigger('change:credit_memos', this, attributes && attributes.credit_memos || []);

			this.on('change:deposit_applications', function (model, deposit_applications)
			{
				model.set('deposit_applications', new InvoiceDepositApplicationCollection(deposit_applications), {silent: true});
			});
			this.trigger('change:deposit_applications', this, attributes && attributes.deposit_applications || []);

			this.on('change:returnauthorizations', function (model, returnauthorizations)
			{
				model.set('returnauthorizations', new ReturnAuthorizationCollection(returnauthorizations), {silent: true});
			});
			this.trigger('change:returnauthorizations', this, attributes && attributes.returnauthorizations || []);
		}

	,	isPayFull : function()
		{
			if (this.get('discountapplies'))
			{
				return this.get('amount') === this.get('duewithdiscount');
			}
			else
			{
				return this.get('amount') === this.get('due');
			}
		}
	});
});
