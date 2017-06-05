define('Balance.Router', ['Balance.View'], function (View)
{
	'use strict';
	
	return Backbone.Router.extend({

		routes: {
			'balance': 'showBalance'
		}
		
	,	initialize: function (application)
		{
			this.application = application;
		}
	
	,	showBalance: function ()
		{
			new View({
				application: this.application
			}).showContent();
		}
	});
});
