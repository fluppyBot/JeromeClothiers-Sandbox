define('InvoiceDepositApplication.Collection', ['InvoiceDepositApplication.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({

		model: Model

	});
});