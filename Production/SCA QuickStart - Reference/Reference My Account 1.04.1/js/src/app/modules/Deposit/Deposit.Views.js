// Deposit.Views.js
// -----------------------
// Views for handling deposits view
define('Deposit.Views', function ()
{
	'use strict';

	var Views = {};

	Views.Details = Backbone.View.extend({

		template: 'deposit_details'

	,	title: _('Deposit Details').translate()

	,	page_header: _('Deposit Details').translate()

	,	attributes:
		{
			'class': 'DepositDetails'
		}

	,	initialize: function (options)
		{
			this.application = options.application;
			this.model = options.model;
		}

	,	showContent: function()
		{
			var self = this;
			
			this.options.application.getLayout().showContent(this, 'transactionhistory', [{
				text: _('Transaction History').translate()
			,	href: 'transactionhistory'
			}, {
				text: _('Deposit #$(0)').translate(self.model.get('tranid'))
			,	href: 'transactionhistory/customerdeposit/' + self.model.get('internalid')
			}]);
		}
	});

	return Views;
});