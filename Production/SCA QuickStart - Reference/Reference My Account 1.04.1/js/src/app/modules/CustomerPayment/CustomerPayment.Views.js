// CustomerPayment.Views.js
// -----------------------
// Views for handling deposits view
define('CustomerPayment.Views', function ()
{
	'use strict';

	var Views = {};

	Views.Details = Backbone.View.extend({

		template: 'customer_payment_details'

	,	title: _('Payment Details').translate()

	,	page_header: _('Payment Details').translate()

	,	attributes:
		{
			'class': 'PaymentDetails'
		}

	,   initialize: function(options)
		{
			this.application = options.application;
		}

	,	showContent: function()
		{
			var self = this;
			
			this.application.getLayout().showContent(this, 'customerpayment', [{
				text: _('Transaction History').translate()
			,	href: '/transactionhistory'
			}, {
				text: _('Payment #$(0)').translate(self.model.get('tranid')) 
			,	href: '/transactionhistory/customerpayment/' + self.model.get('internalid')
			}]);
		}
	});

	return Views;
});
