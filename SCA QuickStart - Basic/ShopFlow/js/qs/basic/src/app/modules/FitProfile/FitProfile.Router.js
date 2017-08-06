// Profile.Router.js
// -----------------------
// Router for handling profile view/update
define('FitProFile.Router',  ['FitProFile.Views', 'FitProfile.Model', 'FormRenderer.View', 'Profile.Model'], function (Views, Model, FormRenderer, ProfileModel)
{
	'use strict';

	return Backbone.Router.extend({
		
		routes: {
			'tailorclient': 'fitProfile'
		,	'tailorclientdetails/:id': 'renderForm'
		,	'fitprofile/:id': 'renderProfile'
		}
				
	,	initialize: function (application, clients)
		{
			this.application = application;
			this.clients = clients;

			this.route(new RegExp('^\\b(tailorclient)\\b(.*?)$'), 'fitProfile');
		}
		
		// load the home page
	,	fitProfile: function ()
		{
			var application = this.application;
			

			var	view = new Views.Client({
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
	,	renderProfile: function(id){
			if(id == "new"){
				window.currentFitProfile.set("current_profile", null);
			} else {
				window.currentFitProfile.set("current_profile", id);
			}
			
			var application = this.application
			,	profileView = new Views.Profile({
					model: new ProfileModel()
				,	application: application
				,	fitprofile: window.currentFitProfile
				});
			
			profileView.showContent();
		}
	});
});