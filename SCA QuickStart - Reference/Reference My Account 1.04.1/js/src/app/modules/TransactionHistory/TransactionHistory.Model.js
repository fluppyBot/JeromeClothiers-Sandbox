define('TransactionHistory.Model', function ()
{
	'use strict';

	return Backbone.Model.extend({

		urlRoot: 'services/transaction-history.ss'

	,	getTypeLabel: function ()
		{
			var type = this.get('recordtype');

			if (type === 'creditmemo')
			{
				type = _('Credit Memo').translate();
			}
			else if (type === 'customerpayment')
			{
				type = _('Payment').translate();
			}
			else if (type === 'customerdeposit')
			{
				type = _('Deposit').translate();
			}
			else if (type === 'depositapplication')
			{
				type = _('Deposit Application').translate();
			}
			else if (type === 'invoice')
			{
				type = _('Invoice').translate();
			}
			else if (type === 'returnauthorization')
			{
				type = _('Return Authorization').translate();
			}

			return type;
		}

	,	getTypeUrl: function ()
		{
			var type = this.get('recordtype')
			,	record_root_url = 'transactionhistory/' + type;

			if (type === 'invoice')
			{
				record_root_url = 'invoices';
			}
			else if (type === 'returnauthorization')
			{
				record_root_url = 'returns';
			}

			return record_root_url + '/' + this.get('internalid');
		}
	});
});