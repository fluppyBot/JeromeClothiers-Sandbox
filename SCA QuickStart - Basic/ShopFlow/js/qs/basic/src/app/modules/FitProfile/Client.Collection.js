// Client.Collection.js
// -----------------------
// Clients collection
define('Client.Collection', ['Client.Model'], function (Model)
{
	'use strict';
	
	return Backbone.Collection.extend(
	{
		model: Model,
		comparator: function(item){
			return item.get('custrecord_tc_last_name');
		}
	});
});
