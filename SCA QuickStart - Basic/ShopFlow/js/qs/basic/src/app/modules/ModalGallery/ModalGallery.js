//Modal Gallery
define('ModalGallery', ['ModalGallery.Views','ModalGallery.Router'], function (Views, Router)
{
	'use strict';
		
	return	{

		Views: Views
	,	Router: Router

	,	mountToApp: function (application)
		{
			return new Router(application);
		}
	};
});
