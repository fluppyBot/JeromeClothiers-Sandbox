var Profile =  Application.getModel('Profile');
Application.defineModel('Taylor', {
	getLogo: function(){
		'use strict';

		var custID = Profile.get().internalid,
			serviceURL = nlapiResolveURL('SUITELET', 'customscript_ps_sl_get_brand_logo', 'customdeploy_ps_sl_get_brand_logo', true) + "&id=" + custID,
			cache = nlapiGetCache('Application'),
			cacheTimeOut = 2 * 60 * 60,
			logoDetails = cache.get('brandLogo-' + custID),
			objRequestBody = '';

		if (!logoDetails || true) {
			var apiRequest = nlapiRequestURL(serviceURL, null, null, null, 'GET');
			objRequestBody = apiRequest.getBody();
			
			cache.put('brandLogo-' + custID, JSON.stringify(objRequestBody), cacheTimeOut);
		} else {
			objRequestBody = JSON.parse(logoDetails);
		}
		return objRequestBody;
	}
});