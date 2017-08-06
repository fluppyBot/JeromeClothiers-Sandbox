// Quote.js
// -----------------
// Defines the Return Authorization module (Model, Collection, Views, Router)
define('Quote', ['Quote.Model','Quote.Collection','Quote.Views','Quote.Router'], function (Model, Collection, Views, Router)
{
	'use strict';
	
	return	{
		Collection: Collection
	,	Model: Model
	,	Router: Router
	,	Views: Views

	,	MenuItems: {
			parent: 'orders'
		,	id: 'quotes'
		,	name: _('Quotes').translate()
		,	url: 'quotes'
		,	index: 5
		,	permission: 'transactions.tranFind.1,transactions.tranEstimate.1'
		}

	,	mountToApp: function (application)
		{
			return new Router(application);
		}
	};
});
