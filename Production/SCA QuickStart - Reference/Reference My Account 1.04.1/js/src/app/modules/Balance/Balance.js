define('Balance', ['Balance.View', 'Balance.Router'], function (View, Router)
{
	'use strict';

	return	{
		View: View
	,	Router: Router

	,	MenuItems: {
			name: _('Billing').translate()
		,	id: 'billing'
		,	index: 3
		,	children: [{
				id: 'balance'
			,	name: _('Account Balance').translate()
			,	url: 'balance'
			,	index: 1
			}]
		}

	,	mountToApp: function (application)
		{
			return new Router(application);
		}
	};
});
