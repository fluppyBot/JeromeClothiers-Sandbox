// PrintStatement.js
// -----------------
// Defines the Print Statement module
define('PrintStatement', ['PrintStatement.Model','PrintStatement.Views','PrintStatement.Router'], function (Model, Views, Router)
{
	'use strict';

	return	{
		Views: Views
	,	Router: Router
	,	Model: Model

	,	MenuItems: {
			parent: 'billing'
		,	id: 'printstatement'
		,	name: _('Print a Statement').translate()
		,	url: 'printstatement'
		,	index: 4
		,	permission: 'transactions.tranStatement.2'
		}

	,	mountToApp: function (application)
		{
			return new Router(application);
		}
	};
});
