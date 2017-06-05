// Profile.Router.js
// -----------------------
// Router for handling profile view/update
define('ModalGallery.Router',  ['ModalGallery.Views', 'FormRenderer.View'], function (Views, FormRenderer)
{
	'use strict';

	return Backbone.Router.extend({
		
		routes: {
			'imagegallery/:key': 'renderGallery'
		}
				
	,	initialize: function (application)
		{
			this.application = application;
		}
		
	,	renderGallery: function(key){

			var application = this.application
			,	galleryView = new Views.Gallery({
					application: application
				,	key: unescape(key).split("|")[0]
				,	title: unescape(key).split("|")[1]
				});
			galleryView.showContent();
		}
	});
});