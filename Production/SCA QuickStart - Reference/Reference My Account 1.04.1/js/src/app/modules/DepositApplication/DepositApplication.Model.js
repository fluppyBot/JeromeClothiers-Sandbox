define('DepositApplication.Model', ['Invoice.Collection'], function (InvoiceCollection)
{
	'use strict';

	return Backbone.Model.extend({

		urlRoot: 'services/deposit-application.ss'

		,	initialize: function (attributes)
			{
				this.on('change:invoices', function (model, invoices)
				{
					model.set('invoices', new InvoiceCollection(invoices), { silent: true });
				});

				this.trigger('change:invoices', this, attributes && attributes.invoices || []);
			}
	});
});