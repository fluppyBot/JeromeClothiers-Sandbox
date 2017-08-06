define('CreditMemo', ['CreditMemo.Model', 'CreditMemo.Collection', 'CreditMemo.Views'], function (Model, Collection, Views)
{
	'use strict';

	return	{
		Model: Model
	,	Collection: Collection
	,	Views: Views
	
	,	mountToApp: function (application)
		{
			application.getUser().set('creditmemos', new Collection());
		}
	};
});