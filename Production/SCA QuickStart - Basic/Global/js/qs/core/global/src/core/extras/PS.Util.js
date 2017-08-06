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
	};
	
	// add size() method to object
	Object.size = function(obj){
	    var size = 0, key;
	    for (key in this) {
	        if (this.hasOwnProperty(key)){
	        	size++;	
	        }
	    }
	    return size;
	};

})();