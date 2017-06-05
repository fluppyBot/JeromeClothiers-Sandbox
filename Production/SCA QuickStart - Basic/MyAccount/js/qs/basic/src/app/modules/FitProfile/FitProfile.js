//Fit Profile
define('FitProFile', ['FitProFile.Views','FitProFile.Router', 'FitProfile.Model'], function (Views, Router, Model)
{
	'use strict';
		
	return	{

		Views: Views
	,	Router: Router
	,	Model: Model
	,	MenuItems: [
			{
				id: 'fitprofile'
			,	name: _('Client Profiles').translate()
			,	url: 'fitprofile'
			,	index: 5
			}
		]

	,	mountToApp: function (application)
		{
			return new Router(application);
		}
	};
});
