//Fit Profile
define('FitProFile', ['FitProFile.Views','FitProFile.Router', 'FitProfile.Model'], function (Views, Router, Model)
{
	'use strict';
		
	return	{

		Views: Views
	,	Router: Router
	,	Model: Model

	,	mountToApp: function (application)
		{
			return new Router(application);
		}
	};
});
