// CreditMemo.Views.js
// -----------------------
// Views for handling CreditMemo view
define('CreditMemo.Views', function ()
{
	'use strict';

	var Views = {};

	Views.Details = Backbone.View.extend({

		template: 'credit_memo_details'

	,	title: _('Credit Memo Details').translate()

	,	page_header: _('Credit Memo Details').translate()

	,	attributes:
		{
			'class': 'CreditMemoDetails'
		}

	,	initialize : function (options)
		{
			this.options = options;
		}

	,	showContent: function()
		{
			var self = this;

			this.options.application.getLayout().showContent(this, 'transactionhistory', [{
					text: _('Transaction History').translate(),
					href: 'transactionhistory'
				}, {
						text:  _('Credit Memo #$(0)').translate(self.model.get('tranid'))
					,	href: 'transactionhistory/creditmemo/' + self.model.get('internalid')
				}]);
			}
		});

	return Views;
});