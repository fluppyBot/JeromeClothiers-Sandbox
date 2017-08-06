function service(request, response){
	
	var labelstr = 'service (caching)';
	
	var cdsutil = new CDS_Lib.Utility();
	cdsutil.startTime(labelstr);	
	
	try {		
		var allParams = request.getAllParameters();
		var method = request.getMethod(),
			id = cdsutil.getParameter(allParams, 'internalid'),
			tag = cdsutil.getParameter(allParams, 'tag'),
			ttl = cdsutil.getParameter(allParams, 'ttl'),
			cache = cdsutil.getParameter(allParams, 'cache'),
			data = JSON.parse( request.getBody() || '{}' );
		
		cdsutil.cacheTtl = cdsutil.validateParamTtl(ttl);
		cdsutil.logger('DEBUG', cdsutil.logTitle, 'ttl = ' + cdsutil.cacheTtl);
		
		var Content = Application.getModel('Content');		
		switch ( method ) {
			case 'GET':
				var jsonResponse = Content.getWithCaching(id, tag);
				var cacheStatus = cdsutil.getCacheStatus(); // sample map = {'cache1': '123/456/456', 'cache2': '123/456/456'};
				var options = {};
				options.cache = cdsutil.validateParamCache(response, cache);
				options.customHeaderCacheStatus = cacheStatus;
				
				cdsutil.logger('DEBUG', cdsutil.logTitle, 'options = ' + JSON.stringify(options));
				
				Application.sendContent(jsonResponse, options);
				
				break;			
			default: 
				Application.sendError( methodNotAllowedError );		
		}
	}
	catch(e){
		Application.sendError( e );
	}
	
	cdsutil.endTime(labelstr, true);
	
	var indexKeys = ['service (caching)', 'get (caching)', 'nlapiLoadRecord (caching)', 'main body (caching)', 'page contents (caching)', 'main fields (caching)'];
	cdsutil.displayTimeSummaryHeader('Duration Summary (Header) (caching)', indexKeys);
	cdsutil.displayTimeSummary('Duration Summary (caching)', indexKeys);
}