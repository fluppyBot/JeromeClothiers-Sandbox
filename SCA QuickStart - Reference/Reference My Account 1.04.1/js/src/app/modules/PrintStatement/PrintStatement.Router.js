// PrintStatement.Router.js
// -----------------------
// Router for handling orders
define('PrintStatement.Router',	['PrintStatement.Views','PrintStatement.Model', 'ErrorManagement'], function (Views, Model, ErrorManagement)
{

	'use strict';

	return Backbone.Router.extend({

		routes: {
			'printstatement': 'printstatement'
		}

	,	initialize: function (application)
		{
			this.application = application;
		}

	,	printstatement: function()
		{
			var	view;
			if (SC.ENVIRONMENT.permissions.transactions.tranStatement === 2)
			{
				view = new Views.Details({
						application: this.application
					,	model: new Model()
					});
			}
			else
			{
				view = new ErrorManagement.Views.ForbiddenError({
					application: this.application
				});
			}

			view.showContent();
			return view;
		}
	});
});