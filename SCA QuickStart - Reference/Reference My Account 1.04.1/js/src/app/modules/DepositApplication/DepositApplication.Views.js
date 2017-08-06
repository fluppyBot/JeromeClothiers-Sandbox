// DepositApplication.Views.js
// -----------------------
// Views for handling deposits view
define('DepositApplication.Views', function ()
{
	'use strict';

	var Views = {};

	Views.Details = Backbone.View.extend({

		template: 'deposit_application_details'

	,	title: _('Deposit Application Details').translate()

	,	page_header: _('Deposit Application Details').translate()

	,	attributes:
		{
			'class': 'DepositApplicationDetails'
		}

	,	initialize : function (options)
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
				text: _('Deposit Application #$(0)').translate(self.model.get('tranid'))
			,	href: 'transactionhistory/depositapplication/' + self.model.get('internalid')
			}]);
		}
	});

	return Views;
});