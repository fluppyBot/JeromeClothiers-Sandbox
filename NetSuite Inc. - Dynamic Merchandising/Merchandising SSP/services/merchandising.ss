/**
 * Service file for Dynamic Merchandising.
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Nov 2012     esia/dembuscado
 * 2.00		  06 Aug 2013	  jcrisostomo	   259458
 * 3.00		  07 Aug 2013	  jcrisostomo	   259599
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {JSON} Merchandising Rule based on zone parameter
 */
function service(request, response) {
	try {	
		//get cache TTL
		var paramArray = request.getAllParameters();
		var ttl = psg_dm.getParameter(paramArray, 'ttl');
		cacheUtil.setTTL(ttl);
		
		var zone = psg_dm.getParameter(paramArray, 'zone');
		var merchRule = psg_dm.getMerchRule(zone);
		
		response.setHeader("Custom-Header-Status", parseInt(status || 200).toString());
		response.setContentType("JSON");
		response.writeLine( JSON.stringify(merchRule) );

		var cacheStatus = {};
		cacheStatus.MerchandisingCache = parseInt(cacheUtil.getHit())+ '/' +parseInt(cacheUtil.getMissed())+ '/' +parseInt(cacheUtil.getUpdate());
		response.addHeader('Custom-Header-Cache-Status', JSON.stringify(cacheStatus));
		
	} catch(e) {
		var status = 500,
			code = "ERR_UNEXPECTED",
			message	= "error";
	
		response.setContentType("JSON");
		response.setHeader("Custom-Header-Status", parseInt(status).toString());
		response.write( JSON.stringify( { "errorStatusCode": parseInt(status).toString(), "errorCode": code, "errorMessage": message } ) );
	}	
}