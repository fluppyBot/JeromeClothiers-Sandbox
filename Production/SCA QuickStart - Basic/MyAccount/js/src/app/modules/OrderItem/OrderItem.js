// OrderItem.js
// -----------------
// Defines the OrderItem  module (Model, Collection, Views, Router)
define('OrderItem', ['OrderItem.Views', 'OrderItem.Model', 'OrderItem.Router', 'OrderItem.Collection'], function (Views, Model, Router, Collection)
{
	'use strict';
	
	return	{
		Views: Views
	,	Model: Model
	,	Router: Router
	,	Collection: Collection

	,	mountToApp: function (application)
		{
			this.application = application;
			return new Router(application);
		}
	};
});