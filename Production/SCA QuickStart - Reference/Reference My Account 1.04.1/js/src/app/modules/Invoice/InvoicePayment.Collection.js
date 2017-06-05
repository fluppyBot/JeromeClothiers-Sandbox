define('InvoicePayment.Collection', ['InvoicePayment.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({

		model: Model

	});
});