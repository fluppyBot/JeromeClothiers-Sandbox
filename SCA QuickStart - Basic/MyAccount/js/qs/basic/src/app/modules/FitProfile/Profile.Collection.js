// Profile.Collection.js
// -----------------------
// Clients collection
define('Profile.Collection', ['Profile.Model'], function (Model)
{
	'use strict';
	
	return Backbone.Collection.extend(
	{
		model: Model
	});
});
