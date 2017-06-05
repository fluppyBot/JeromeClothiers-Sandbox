define('PaymentWizard.CreditTransaction.Collection', ['PaymentWizard.CreditTransaction.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({
		model: Model
	});
});