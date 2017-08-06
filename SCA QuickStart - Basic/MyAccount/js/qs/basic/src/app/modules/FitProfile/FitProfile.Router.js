// Profile.Router.js
// -----------------------
// Router for handling profile view/update
define('FitProFile.Router',  ['FitProFile.Views', 'FitProfile.Model', 'FormRenderer.View'], function (Views, Model, FormRenderer)
{
	'use strict';

	return Backbone.Router.extend({
		
		routes: {
			'fitprofile': 'fitProfile'
		,	'fitprofile/:id': 'renderForm'
		}
				
	,	initialize: function (application, clients)
		{
			this.application = application;
			this.clients = clients;
		}
		
		// load the home page
	,	fitProfile: function ()
		{
			var application = this.application;
			

			var	view = new Views.Home({
				application: application
			,	model: new Model(application.getUser().get("internalid"))
			});
			view.model.on("afterInitialize", function(){
				view.showContent();
			})
		}
	,	renderForm: function(id){
			var application = this.application;

			var	view = new FormRenderer({
				application: application
			,	profileModel: application.getLayout().currentView.model
			,	mode: id				
			});

			view.showContent();
		}
	});
});