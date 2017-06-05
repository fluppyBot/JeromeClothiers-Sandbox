define('Balance.View', function ()
{
	'use strict';

	return Backbone.View.extend({
		
		template: 'balance'

	,	attributes: {
			'class': 'AccountBalance'
		}
		
	,	initialize: function (options)
		{
			this.application = options.application;
			this.model = this.application.getUser();
			this.title = _('Account Balance').translate();
		}

	,	showContent: function ()
		{
			this.application.getLayout().showContent(this, 'balance', [{
				text: this.title
			,	href: '/balance'
			}]);
		}
	});
});