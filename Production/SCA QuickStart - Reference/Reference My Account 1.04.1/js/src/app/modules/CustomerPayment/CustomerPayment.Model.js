define('CustomerPayment.Model',['OrderPaymentmethod.Collection'], function (OrderPaymentmethodCollection)
{
	'use strict';

	return Backbone.Model.extend({

			urlRoot: 'services/payment.ss'
		
		,	initialize: function (attributes)
			{
				this.on('change:paymentmethods', function (model, paymentmethods)
				{
					model.set('paymentmethods', new OrderPaymentmethodCollection(paymentmethods), {silent: true});
				});
				
				this.trigger('change:paymentmethods', this, attributes && attributes.paymentmethod || []);
			}

	});
});