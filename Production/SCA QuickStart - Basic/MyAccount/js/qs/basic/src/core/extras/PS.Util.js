(function ()
{
	'use strict';
	var BASE_URL = "/app/site/hosting/scriptlet.nl";


	_.requestUrl = function(id, deploy_id, type, params){
		var url = BASE_URL + "?script=" + id + "&deploy=" + deploy_id;

		var req = jQuery.ajax({
			method: type,
			url: url,
			data: params
		});

		return req;
	}

})();