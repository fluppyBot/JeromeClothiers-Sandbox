define('Deposit.Model',['OrderPaymentmethod.Collection', 'Invoice.Collection'], function (OrderPaymentmethodCollection, InvoiceCollection)
{
	'use strict';

	return Backbone.Model.extend({

			urlRoot: 'services/deposit.ss'

		,	initialize: function (attributes)
			{
				this.on('change:paymentmethods', function (model, paymentmethods)
				{
					model.set('paymentmethods', new OrderPaymentmethodCollection(paymentmethods), {silent: true});
				});

				this.trigger('change:paymentmethods', this, attributes && attributes.paymentmethod || []);

				this.on('change:invoices', function (model, invoices)
				{
					model.set('invoices', new InvoiceCollection(invoices), { silent: true });
				});

				this.trigger('change:invoices', this, attributes && attributes.invoices || []);

				// TODO: This should be returned from the server
				if (!this.get('type'))
				{
					this.set('type', 'Deposit');
				}
			}
	});
});