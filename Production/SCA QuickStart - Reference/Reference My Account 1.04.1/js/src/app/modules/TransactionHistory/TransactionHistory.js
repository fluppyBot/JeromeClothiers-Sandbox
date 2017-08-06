// TransactionHistory.js
// -----------------
// Defines the Transaction module (Model, Collection, Views, Router)
define('TransactionHistory', ['TransactionHistory.Model','TransactionHistory.Collection','TransactionHistory.Views','TransactionHistory.Router'], function (Model, Collection, Views, Router)
{
	'use strict';
	
	return	{
		Model: Model
	,	Collection: Collection
	,	Views: Views
	,	Router: Router

	,	MenuItems: {
			parent: 'billing'
		,	id: 'transactionhistory'
		,	name: _('Transaction History').translate()
		,	url: 'transactionhistory'
		,	permissionOperator: 'OR'
		,	permission: 'transactions.tranCustInvc.1, transactions.tranCustCred.1, transactions.tranCustPymt.1, transactions.tranCustDep.1, transactions.tranDepAppl.1'
		,	index: 3
		}

	,	mountToApp: function (application)
		{
			return new Router(application);
		}
	};
});
