//Init.js
var container = container || nlapiGetWebContainer(),
	session = session || container.getShoppingSession(),
	settings = settings || session.getSiteSettings(),
	customer = customer || session.getCustomer(),
	context = context || nlapiGetContext(),
	order = order || nlapiGetWebContainer().getShoppingSession().getOrder();


var CDS_Lib;
if(!CDS_Lib) CDS_Lib = {};

CDS_Lib.Utility = function Utility(){
	
	// make it a singleton
	if ( Utility.prototype._singletonInstance ) {
		return Utility.prototype._singletonInstance;
	}
	Utility.prototype._singletonInstance = this;
	
	// private members
	var timeEntries = [];
	var showDebugMessages = false;
	var cacheStatus = [];
	
	// public members
	this.cacheTtl = 300;
	this.logTitle = 'Content Delivery Bundle';
	
	// public methods
	this.startTime = function(index){
		timeEntries[index] = Date.now();
	};
	
	this.endTime = function(index, summarize) {
		if(timeEntries[index] != undefined){
			var duration = Date.now() - timeEntries[index];
			
			if(summarize){
				timeEntries[index] = duration;
			}
			else{
				this.logger('DEBUG', index, duration);
				delete timeEntries[index];	
			}
		}
	};
	
	this.displayTimeSummary = function(title, arrIndex) {
		var dbgMessage = '';
		
		for(var i = 0; i < arrIndex.length; i++){
			var key = arrIndex[i];
			
			dbgMessage += (timeEntries[key] == undefined ? 0 : timeEntries[key]) + ',';
			delete timeEntries[key];
		}
		
		this.logger('DEBUG', title, dbgMessage);
	};
	
	this.displayTimeSummaryHeader = function(title, arrIndex) {
		var dbgMessage = '';
		
		for(var i = 0; i < arrIndex.length; i++){
			var key = arrIndex[i];
			
			dbgMessage += key + ',';
		}
		
		this.logger('DEBUG', title, dbgMessage);
	};
	
	this.logger = function(level, title, detail){
		if(showDebugMessages){
			nlapiLogExecution(level, title, detail);
		}
	};
	
	// cache related methods
	/**
	 * lookupCache
	 * 
	 * Reads from cacheName the specified key(s)
	 * 
	 * Parameters:
	 *     cacheName [required] - name of cache. There is an internal list of supported cache names in this function.
	 *         cds_pagetags, cds_pagecontents, cds_contents
	 *     keys [required] - can be an array or a single value
	 * 
	 * Returns:
	 *     if keys is an array, returned value is a map. It contains 2 fields: missed (array of integers) and cached (array of JSON.parse'd objects). 
	 *         The JSON.parse'd object's structure depends on the cache name. 
	 *     if keys is a single value, returned value is either null or the JSON.parse'd object. The JSON.parse'd object's structure depends on the cache name. 
	 * 
	 */
	this.lookupCache = function(cacheName, keys) {
		var cacheReturnModel = {};
		cacheReturnModel.missed = [];
		cacheReturnModel.cached = [];
			
		var cache = nlapiGetCache(cacheName);
		
		if(cacheStatus[cacheName] == undefined){
			cacheStatus[cacheName] = {miss: 0, hit: 0, update: 0};
		}
		
		switch(cacheName){
			case 'cds_pagetags':
				if(keys instanceof Array){
					// special case for tags since it is not storing stringified map in value, just a straight string
					for(var i = 0; i < keys.length; i++){
						var cacheValueStr = cache.get(keys[i]);
						if(cacheValueStr == null){
							cacheReturnModel.missed.push(keys[i]);
							
							cacheStatus[cacheName].miss++;
						}
						else{
							var tagmodel = {};
							tagmodel.id = keys[i];
							tagmodel.name = cacheValueStr;
							
							cacheReturnModel.cached.push(tagmodel);
							
							cacheStatus[cacheName].hit++;
						}
					}
					
				}
				else{
					// do nothing for now
				}
				
				break;
			default:
				if(keys instanceof Array){
					// do nothing for now
				}
				else{
					var cacheValueStr = cache.get(keys);
					if(cacheValueStr == null){
						cacheStatus[cacheName].miss++;
						
						return null;
					}
					else{
						cacheStatus[cacheName].hit++;
						
						return JSON.parse(cacheValueStr);
					}
				}
		};
		
		return cacheReturnModel; // returns a model only if keys is an array
	};
	
	/**
	 * updateCache
	 * 
	 * Adds or updates the value of key in cacheName
	 * 
	 * Parameters:
	 *     cacheName [required] - name of cache
	 *     key [required] - key in cache
	 *     value [required] - value to put in key. This object will be converted to JSON string using JSON.stringify()
	 *     ttl [optional] - time-to-live for the key in cache
	 * 
	 * Returns:
	 *     true if put is successful, false if it fails
	 * 
	 */
	this.updateCache = function(cacheName, key, value, ttl) {
		var ret = false;
		
		try{
			var putReturn = {};
			
			var cache = nlapiGetCache(cacheName);
			
			switch(cacheName){
				case 'cds_pagetags':
				case 'cds_tagnames':
					putReturn = cache.put(key, value, ttl); // prevent stringify for tags. i.e. name": "\"tag:tag15\""
					break;
				default:
					putReturn = cache.put(key, JSON.stringify(value), ttl);
			}
			
			if(putReturn != null && putReturn.status == 'SUCCESS'){
				this.logger('DEBUG', this.logTitle, "Cache '" + cacheName + "' updated: key = " + key);
				ret = true;
				cacheStatus[cacheName].update++;
			}
			else{
				this.logger('DEBUG', this.logTitle, "Update failed for Cache '" + cacheName + "': key = " + key);
			}
		}
		catch(e){
			this.logger('DEBUG', this.logTitle, "Exception. " + e);
		}		
		
		return ret;
	};
	
	this.getCacheStatus = function() {
		var ret = {};
		
		try{
			for(cachename in cacheStatus){
				ret[cachename] = cacheStatus[cachename].hit + '/' 
					+ cacheStatus[cachename].miss + '/'
					+ cacheStatus[cachename].update; 
			}
		}
		catch(e){}		
		
		return ret;
	};
	
	this.getParameter = function(paramArray, paramToGet){
		
		if(paramArray == null || paramToGet == null){
			return null;
		}
		
		for(var param in paramArray){
			if (param.toUpperCase() == paramToGet.toUpperCase()){
				return(paramArray[param]);
			}
		}
		
		return null;
	};
	
	this.validateParamTtl = function(paramValue){
		var twoHours = 60 * 60 * 2; // in seconds
		var fiveMinutes = 60 * 5; 
		
		if(paramValue == null || paramValue == undefined || paramValue == ''){
			return twoHours;
		}
		
		var paramValueInt = parseInt(paramValue);
		if(isNaN(paramValueInt) || paramValueInt < fiveMinutes || paramValueInt > twoHours){
			return twoHours;
		}
		else{
			return paramValueInt;	
		}
	};
	
	this.validateParamCache = function(response, paramValue){
		var ret;
		
		if(paramValue) paramValue = paramValue.toLowerCase();
		
		switch(paramValue){
			case 'short':
				ret = response.CACHE_DURATION_SHORT;
				
				break;
			case 'medium':
				ret = response.CACHE_DURATION_MEDIUM;
				
				break;
			case 'long':
				ret = response.CACHE_DURATION_LONG;
				
				break;
			default:
				ret = response.CACHE_DURATION_MEDIUM;
				
				break;
		}
		
		return ret;
	};
	
	this.convertToArray = function(paramValue){
		var ret = [];
		
		if(paramValue == null || paramValue == undefined || paramValue == ''){
			return ret;
		}
		
		if(paramValue instanceof Array){
			ret = paramValue;
		}
		else{
			ret.push(paramValue);
		}
		
		return ret;
	};
};

CDS_Lib.CONST_APPROVED_STATUS_ID = 1;
CDS_Lib.CONST_LANDING_PAGE_TYPE_ID = 1;

CDS_Lib.PageRankEngine = function PageRankEngine(){
	
	var cdsutil = new CDS_Lib.Utility();	
	
	var tagParams = new Array(); // array of CDS_Lib.PageRankTagParam
	var systemTagGroups = new Array(); // array of CDS_Lib.PageRankTagGroup
	var systemTagGroupMap = {}; // associative array version of systemTagGroups
	var urlPageIdMaps = new Array(); // array of CDS_Lib.UrlPageIdMap
	var paramSiteId;
	
	/* PRIVATE FUNCTIONS START */
	function getTagGroup(tag){
		var ret = null;
		
		if(tag){
			try{
				ret = tag.split(':')[0];
			}
			catch(e) {}
		}
		
		return ret;			
	}
	
	function matchAgainstDefaultPage(page, defaultPage){
		var ret = {};
		
		if(defaultPage){
			if(page.rank.matchedParamsScore == 0){
				ret = defaultPage;	
			}
			else{
				ret = page;
			}			
		}
		else{
			if(page.rank.matchedParamsScore == 0){
				if(hasMatchingTags(page.rank)){
					ret = page;
				}
				else{
					ret = {};	
				}
			}
			else{
				ret = page;
			}
		}
		
//		cdsutil.logger('DEBUG', 'alfred', 'matched against default page. winner = ' + JSON.stringify(ret));
		
		return ret;
	}
	
	function hasMatchingTags(pageRank){
		var ret = false;
		
		// loop over the total tags in the system
		for(var i = 0; i < pageRank.tagGroupScores.length; i++){
			var pageTagGroupScore = pageRank.tagGroupScores[i];
			
//			cdsutil.logger('DEBUG', 'alfred', 'pageTagGroupScore.tagGroup = ' + pageTagGroupScore.tagGroup + ', systemTagGroupMap[pageTagGroupScore.tagGroup] = ' + systemTagGroupMap[pageTagGroupScore.tagGroup]);
			
			if(pageTagGroupScore.score < systemTagGroupMap[pageTagGroupScore.tagGroup] && pageTagGroupScore.score > 0){
				ret = true;
				break;
			}
		}
		
		return ret;
	}
	
	function isEmpty(obj) {
	    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }

	    return true;
	}
	/* PRIVATE FUNCTIONS END */
	
	/* PUBLIC FUNCTIONS START */
	/**
	 * getAllDefaultPages
	 * 
	 * Returns all pages that have no tags and assigned to the specified siteid
	 * 
	 * Parameters:
	 *     siteId [required] - internal id of a website
	 * 
	 * Returns:
	 *     an array of maps: {id: '', pageid: '', query: '', type: ''}
	 * 
	 */
	function getAllDefaultPages(siteId){
		var ret = new Array();
		
		var filters = [
  		    new nlobjSearchFilter('custrecord_ns_cdp_status', 'custrecord_ns_cdq_pageid', 'is', CDS_Lib.CONST_APPROVED_STATUS_ID),
  		    new nlobjSearchFilter('isinactive', 'custrecord_ns_cdq_pageid', 'is', 'F'),
  		    new nlobjSearchFilter('custrecord_ns_cdp_tag', 'custrecord_ns_cdq_pageid', 'noneof', '@NONE@')
  		];
   		
   		if(!siteId){
   			siteId = -999; //session.getSiteSettings().siteid;
   		}
   		
   		filters.push( new nlobjSearchFilter('custrecord_ns_cdp_site', 'custrecord_ns_cdq_pageid', 'anyof', [siteId]) );
   		
   		var columns = [	       
            new nlobjSearchColumn('custrecord_ns_cdq_query').setSort(),
            new nlobjSearchColumn('custrecord_ns_cdq_pageid'),            
            new nlobjSearchColumn('custrecord_ns_cdp_status', 'custrecord_ns_cdq_pageid'),
            new nlobjSearchColumn('custrecord_ns_cdp_type', 'custrecord_ns_cdq_pageid')
        ];
   		
   		var startIndex = 0;
		var batchCount = 1000;
		var searchObj = nlapiCreateSearch('customrecord_ns_cd_query', filters, columns);
		var resultSet = searchObj.runSearch();
		res = resultSet.getResults(startIndex, startIndex + batchCount);
		
		while(res.length != 0){
			
			for(var i = 0; i < res.length; i++){
				var jsonModel = {};
				
				jsonModel.id = res[i].getId();
				jsonModel.pageid = res[i].getValue('custrecord_ns_cdq_pageid');
				jsonModel.query = res[i].getValue('custrecord_ns_cdq_query');
				jsonModel.type = res[i].getValue('custrecord_ns_cdp_type', 'custrecord_ns_cdq_pageid');
				
				ret.push(jsonModel);
			}
			
			startIndex += batchCount; 
			res = resultSet.getResults(startIndex, startIndex + batchCount);
		}
		
//		cdsutil.logger('DEBUG', 'alfred', 'Default Pages URLs = ' + ret.length);
		return ret;	
	}
	
	function filterUrlByTags(siteId, urlTags){
		var ret = new Array();
		
		if(!urlTags || urlTags.length == 0){
			return ret; // if URL tag params is empty
		}
		
		var filters = [
  		    new nlobjSearchFilter('custrecord_ns_cdp_status', 'custrecord_ns_cdq_pageid', 'is', CDS_Lib.CONST_APPROVED_STATUS_ID),
  		    new nlobjSearchFilter('isinactive', 'custrecord_ns_cdq_pageid', 'is', 'F'),
  		    new nlobjSearchFilter('custrecord_ns_cdp_tag', 'custrecord_ns_cdq_pageid', 'allof', urlTags),
  		    new nlobjSearchFilter('custrecord_ns_cdp_tagcount', 'custrecord_ns_cdq_pageid', 'equalto', urlTags.length),
  		];
   		
   		if(!siteId){
   			siteId = -999; //session.getSiteSettings().siteid;
   		}
   		
   		filters.push( new nlobjSearchFilter('custrecord_ns_cdp_site', 'custrecord_ns_cdq_pageid', 'anyof', [siteId]) );
   		
   		var columns = [	       
            new nlobjSearchColumn('custrecord_ns_cdq_query').setSort(),
            new nlobjSearchColumn('custrecord_ns_cdq_pageid'),            
            new nlobjSearchColumn('custrecord_ns_cdp_status', 'custrecord_ns_cdq_pageid'),
            new nlobjSearchColumn('custrecord_ns_cdp_type', 'custrecord_ns_cdq_pageid')
        ];
   		
   		var startIndex = 0;
		var batchCount = 1000;
		var searchObj = nlapiCreateSearch('customrecord_ns_cd_query', filters, columns);
		var resultSet = searchObj.runSearch();
		res = resultSet.getResults(startIndex, startIndex + batchCount);
		
		while(res.length != 0){
			
			for(var i = 0; i < res.length; i++){
				var jsonModel = {};
				
				jsonModel.id = res[i].getId();
				jsonModel.pageid = res[i].getValue('custrecord_ns_cdq_pageid');
				jsonModel.query = res[i].getValue('custrecord_ns_cdq_query');
				jsonModel.type = res[i].getValue('custrecord_ns_cdp_type', 'custrecord_ns_cdq_pageid');
				
				ret.push(jsonModel);
			}
			
			startIndex += batchCount; 
			res = resultSet.getResults(startIndex, startIndex + batchCount);
		}
		
//		cdsutil.logger('DEBUG', 'alfred', 'Filtered URLs = ' + ret.length);
		return ret;	
	}
	
	function generateJsonModel(defaultPages, filteredPages){
		var ret = new Array();
		
		if(filteredPages.length == 0){
			return defaultPages;
		}
		
		var urlMap = {};
		// loop over the list of defaultPages and place it in a map
		for(var i = 0; i < defaultPages.length; i++){
			var jsonModel = defaultPages[i];
			
			urlMap[jsonModel.query] = jsonModel;
		}
		
		// loop over the list of filtered Pages and replace entries in the map
		for(var i = 0; i < filteredPages.length; i++){
			var jsonModel = filteredPages[i];
			
			urlMap[jsonModel.query] = jsonModel;
		}
		
		// dump content of map in array
		for(var key in urlMap) {
	        if(urlMap.hasOwnProperty(key)){
	        	ret.push(urlMap[key]);
	        }   
	    }
		
		return ret;
	}
	/* PUBLIC FUNCTIONS END */
	
	return {
		getAllDefaultPages: getAllDefaultPages, 
		filterUrlByTags: filterUrlByTags,
		generateJsonModel: generateJsonModel 
    };
};

CDS_Lib.CDSClass = function(args) {
	var klass = function() {
		return (this.initialize) ? this.initialize.apply(this, arguments) : this;
	};
	for (var key in args) klass.prototype[key] = args[key];
	return klass;
};

CDS_Lib.PageRankTagParam = new CDS_Lib.CDSClass({
	initialize : function () {
		this.tagId;
		this.tag;
		this.tagGroup;
		this.score;
	}
});

CDS_Lib.PageRankTag = new CDS_Lib.CDSClass({
	initialize : function () {
		this.tag;
		this.tagGroup;
	}
});

CDS_Lib.PageRankTagGroup = new CDS_Lib.CDSClass({
	initialize : function () {
		this.tagGroup;
		this.totalCount = 0;
	}
});

CDS_Lib.PageRankTagGroupScore = new CDS_Lib.CDSClass({
	initialize : function () {
		this.tagGroup;
		this.score = 0;
	}
});

CDS_Lib.PageRankContent = new CDS_Lib.CDSClass({
	initialize : function () {
		this.pageId;
		this.tagGroupScores = new Array(); // array of PageRankTagGroupScore
		this.matchedParamsScore = 0;
		this.paramsOrderScore = 0;
		this.finalScore = 0;
	}
});

CDS_Lib.UrlPageIdMap = new CDS_Lib.CDSClass({
	initialize : function () {
		this.urlId;
		this.url;
		this.tags;
		this.pages = new Array(); // array of PageDetail
	}
});

CDS_Lib.PageDetail = new CDS_Lib.CDSClass({
	initialize : function () {
		this.pageId;
		this.tags;
		this.name;
		this.rank; // PageRankContent
		this.urlId; // optional
	}
});

//Content.js
Application.defineModel('Content', {
	
	getWithCaching: function (id, tag) {

		var cacheName = '';
		
		var cdsutil = new CDS_Lib.Utility();
		cdsutil.startTime('get (caching)');
		
		var pageId = id;
		var record = {};
		
		cdsutil.startTime('nlapiLoadRecord (caching)');
		
		cacheName = 'cds_pages';
		var pageCacheRec = cdsutil.lookupCache(cacheName, pageId);
		if(pageCacheRec){
			record.sites = pageCacheRec.sites;
			record.status = pageCacheRec.status;
			record.isinactive = pageCacheRec.isinactive;
			record.type = pageCacheRec.type;
			record.mainbody = pageCacheRec.mainbody;
			record.lineitemcount = pageCacheRec.lineitemcount;
			record.lineitemvalues = pageCacheRec.lineitemvalues;
			record.tplid = pageCacheRec.tplid;
			record.tags = pageCacheRec.tags;
			record.title = pageCacheRec.title;
			record.metadescription = pageCacheRec.metadescription;
			record.metakeywords = pageCacheRec.metakeywords;
			record.pageheader = pageCacheRec.pageheader;
			record.metaextra = pageCacheRec.metaextra;
		}
		else{
			var loadret = nlapiLoadRecord("customrecord_ns_cd_page", pageId);
			record.sites = cdsutil.convertToArray(loadret.getFieldValues("custrecord_ns_cdp_site"));
			record.status = loadret.getFieldValue("custrecord_ns_cdp_status");
			record.isinactive = loadret.getFieldValue("isinactive");
			record.type = loadret.getFieldValue("custrecord_ns_cdp_type");
			record.mainbody = loadret.getFieldValue('custrecord_ns_cdp_mainbody');
			record.lineitemcount = loadret.getLineItemCount('recmachcustrecord_ns_cdpc_pageid');
			record.lineitemvalues = [];
			for ( var i = 1; i <= record.lineitemcount ; i++) {
				record.lineitemvalues.push(loadret.getLineItemValue('recmachcustrecord_ns_cdpc_pageid', 'id', i));
			}
			record.tplid = loadret.getFieldValue("custrecord_ns_cdp_tplid");
			record.tags = cdsutil.convertToArray(loadret.getFieldValues("custrecord_ns_cdp_tag"));
			record.title = loadret.getFieldValue("custrecord_ns_cdp_title");
			record.metadescription = loadret.getFieldValue("custrecord_ns_cdp_metadescription");
			record.metakeywords = loadret.getFieldValue("custrecord_ns_cdp_metakeywords");
			record.pageheader = loadret.getFieldValue("custrecord_ns_cdp_pageheader");
			record.metaextra = loadret.getFieldValue("custrecord_ns_cdp_metaextra");
			
			cdsutil.updateCache(cacheName, pageId, record, cdsutil.cacheTtl);
		}
		
		cdsutil.endTime('nlapiLoadRecord (caching)', true);
		
		var result = {};
		var res, filters, columns;
		if (record) {
			
			cdsutil.startTime('main body (caching)');
			
//			cdsutil.logger('DEBUG', 'Content Delivery Service', 'session.getSiteSettings().siteid = ' + session.getSiteSettings().siteid);
			
			if ( context.getFeature('MULTISITE') && session.getSiteSettings().siteid ){
				var sites = record.sites;
				if (sites.indexOf(session.getSiteSettings().siteid.toString()) === -1){
					return {};
				}
			}		
			
			if(record.status != CDS_Lib.CONST_APPROVED_STATUS_ID){
				return {};
			}
			
			if(record.isinactive == 'T'){
				return {};
			}
			
			// load Main Body
			if(record.type == CDS_Lib.CONST_LANDING_PAGE_TYPE_ID){
				
	            var contentId = record.mainbody; 
	            if(contentId){
	            	
	            	// lookup content cache
	            	cacheName = 'cds_contents';
	            	var contentCacheRec = cdsutil.lookupCache(cacheName, contentId);
	            	if(contentCacheRec == null){
	            		var contentRec = nlapiLoadRecord('customrecord_ns_cd_content', contentId);
		            	var contentRecStatus = contentRec.getFieldValue('custrecord_ns_cdc_status');
		            	var contentRecActualContent = contentRec.getFieldValue('custrecord_ns_cdc_content');
		            	var contentRecFileId = contentRec.getFieldValue('custrecord_ns_cdc_file');
		            	var filecontent = '';
		            	
		            	if(contentRecStatus == CDS_Lib.CONST_APPROVED_STATUS_ID){
		            		if(contentRecFileId){
		            			var fileContentUtilUrl = nlapiResolveURL('SUITELET', 'customscript_cds_sl_loadfileutil', 'customdeploy_cds_sl_loadfileutil', true);
		            			filecontent = nlapiRequestURL(fileContentUtilUrl + '&fileid=' + contentRecFileId).getBody();
		            			result.content = filecontent;
		            		}
		            		else{
		            			if(contentRecActualContent) result.content = contentRecActualContent;
		            		}		
		            	}
		            	
		            	var objToCache = {};
		            	objToCache.status = contentRecStatus;
		            	objToCache.content = contentRecActualContent;
		            	objToCache.file = contentRecFileId;
		            	objToCache.filecontent = filecontent;
		            	
		            	cdsutil.updateCache(cacheName, contentId, objToCache, cdsutil.cacheTtl);
	            	}
	            	else{
	            		var contentRecStatus = contentCacheRec.status;
		            	var contentRecActualContent = contentCacheRec.content;
		            	var contentRecFileId = contentCacheRec.file;
		            	var contentFileContent = contentCacheRec.filecontent;
		            	
		            	if(contentRecStatus == CDS_Lib.CONST_APPROVED_STATUS_ID){
		            		if(contentRecFileId){
		            			result.content = contentFileContent;
		            		}
		            		else{
		            			if(contentRecActualContent) result.content = contentRecActualContent;
		            		}		
		            	}	
	            	}
	            }
			}
			
			cdsutil.endTime('main body (caching)', true);
			
			cdsutil.startTime('page contents (caching)');
					
			cacheName = 'cds_pagecontents';
            var pageContentIds = [];
			result.pagecontent = [];
			
			var pageContentLength = record.lineitemcount;
			for ( var i = 0; i < pageContentLength ; i++) {
				var id = record.lineitemvalues[i];
				
				var cacheValue = cdsutil.lookupCache(cacheName, id);
				if(cacheValue == null){
					pageContentIds.push(id);
				}
				else{
					// what can i do on the cache?
					var obj = {};
					
					var target = cacheValue.target;
	            	var content = cacheValue.content; // should already contain the value of the file or editor text
	            	var contentType = cacheValue.type;
	            	var CONST_MERCHANDISING_RULE_ID = '2'; // see custom list 
	            	
	            	if(id) obj.id = id;
	            	
	            	if(target) obj.target = target;
	            	
	            	if(contentType == CONST_MERCHANDISING_RULE_ID){
	            		obj.contenttype = 'merchandising';
	            	}
	            	else{
	            		obj.contenttype = 'html';
	            	}
	            	obj.content = content;
	            	
	            	result.pagecontent.push(obj); 
				}
			}
			
			if (pageContentIds.length) {
				
				filters = [
                   new nlobjSearchFilter('internalid', null, 'anyof', pageContentIds),
	               new nlobjSearchFilter('custrecord_ns_cdc_status', 'custrecord_ns_cdpc_contentid', 'is', CDS_Lib.CONST_APPROVED_STATUS_ID)
                ];
				
				columns = [
		           new nlobjSearchColumn('internalid').setSort(),
                   new nlobjSearchColumn('name', 'custrecord_ns_cdpc_contentid'),
                   new nlobjSearchColumn('custrecord_ns_cdpc_target'),
                   new nlobjSearchColumn('custrecord_ns_cdc_type', 'custrecord_ns_cdpc_contentid'),
                   new nlobjSearchColumn('custrecord_ns_cdc_status', 'custrecord_ns_cdpc_contentid'),
	               new nlobjSearchColumn('custrecord_ns_cdc_content', 'custrecord_ns_cdpc_contentid'),
	               new nlobjSearchColumn('custrecord_ns_cdc_merchid', 'custrecord_ns_cdpc_contentid'),
	               new nlobjSearchColumn('custrecord_ns_cdc_file', 'custrecord_ns_cdpc_contentid')
	            ];

//				cdsutil.startTime('search customrecord_ns_cd_pagecontent');
	            res = nlapiSearchRecord('customrecord_ns_cd_pagecontent', null, filters, columns);
//	            cdsutil.endTime('search customrecord_ns_cd_pagecontent');
	            
	            if(res){
	            	for(var i = 0; i < res.length; i++){
	    	            
		            	var obj = {};
		            	
		            	var id = res[i].getId();
//		            	var name = res[i].getValue('name', 'custrecord_ns_cdpc_contentid');
		            	var target = res[i].getValue('custrecord_ns_cdpc_target');
		            	var content = res[i].getValue('custrecord_ns_cdc_content', 'custrecord_ns_cdpc_contentid'); 
		            	var contentType = res[i].getValue('custrecord_ns_cdc_type', 'custrecord_ns_cdpc_contentid');
		            	var CONST_MERCHANDISING_RULE_ID = '2'; // see custom list 
		            	
		            	if(id) obj.id = id;
		            	
		            	if(target) obj.target = target;
		            	
		            	if(contentType == CONST_MERCHANDISING_RULE_ID){
		            		obj.contenttype = 'merchandising';
		            		var merchId = res[i].getValue('custrecord_ns_cdc_merchid', 'custrecord_ns_cdpc_contentid');
		            		obj.content = nlapiLookupField('customrecord_merch_rule', merchId, 'name');
//		            		obj.content = res[i].getText('custrecord_ns_cdc_merchid', 'custrecord_ns_cdpc_contentid'); // core bug?
		            	}
		            	else{
		            		obj.contenttype = 'html';
		            		
		            		// first workaround for the permission issue
//		            		var filecontent = res[i].getValue('custrecord_ns_cdc_filecontent', 'custrecord_ns_cdpc_contentid'); 
//		            		cdsutil.logger('DEBUG', 'alfred', 'filecontent = ' + JSON.stringify(filecontent));
//		            		if(filecontent){
//		            			obj.content = filecontent;
//		            		}
//		            		else{
//		            			if(content) obj.content = content;	
//		            		}
		            		
		            		// second workaround for the permission issue
//		            		cdsutil.startTime('get the file');
		            		var file = res[i].getValue('custrecord_ns_cdc_file', 'custrecord_ns_cdpc_contentid'); 
		            		if(file){
		            			var fileContentUtilUrl = nlapiResolveURL('SUITELET', 'customscript_cds_sl_loadfileutil', 'customdeploy_cds_sl_loadfileutil', true);
		            			var filecontent = nlapiRequestURL(fileContentUtilUrl + '&fileid=' + file).getBody();
		            			obj.content = filecontent;
		            		}
		            		else{
		            			if(content) obj.content = content;
		            		}
//		            		cdsutil.endTime('get the file');
		            	}
		            	
		            	result.pagecontent.push(obj); 
		            	
		            	// add to cache
		            	var newCacheValue = {};
		            	newCacheValue.target = obj.target;
		            	newCacheValue.content = obj.content; 
		            	newCacheValue.type = contentType;
		            	
		            	cdsutil.updateCache(cacheName, id, newCacheValue, cdsutil.cacheTtl);
		            }	
	            }
			}
			
			cdsutil.endTime('page contents (caching)', true);
			
			cdsutil.startTime('main fields (caching)');
			// main fields
			result.internalid = pageId;
			
			var templateId = record.tplid; 
			if (templateId) result.template = templateId;
			var tags = record.tags;
			result.tags = [];
			if(tags){
				
				// check if tags are in cache
				var tagsCacheName = 'cds_pagetags';
				var cacheResult = cdsutil.lookupCache(tagsCacheName, tags);
				var missedTagIds = cacheResult.missed;
				var cachedTagModels = cacheResult.cached;
				
				var tagList = cachedTagModels;
				
				if(missedTagIds.length > 0){
					filters = [
			           new nlobjSearchFilter('internalid', null, 'anyof', missedTagIds)
	                ];
					
					columns = [
			           new nlobjSearchColumn('internalid'),
	                   new nlobjSearchColumn('name')
		            ];

		            res = nlapiSearchRecord('customrecord_ns_cd_tag', null, filters, columns);
		            if(res){
		            	for(var i = 0; i < missedTagIds.length; i++){
		            		
		            		cdsutil.updateCache(tagsCacheName, res[i].getId(), res[i].getValue('name'), cdsutil.cacheTtl);
		            		
							tagList.push({
								id: res[i].getId(),
								name: res[i].getValue('name')
							});
						}	
		            }
				}
				
				// sort tags by id
				tagList.sort(function(a,b) { 
					return parseInt(a.id) - parseInt(b.id); 
				}); 
				
				result.tags = tagList;
			}			 
			
        	// get the first entry for now while there's no multi-language support
        	var title = record.title;
			var metadescription = record.metadescription;
			var metakeywords = record.metakeywords;
			var pageheader = record.pageheader;
			var metaextra = record.metaextra;
			
			if(title) result.title = title;
			
			if(metadescription) result.metadescription = metadescription;
			
			if(metakeywords) result.metakeywords = metakeywords;
			
			if(pageheader) result.pageheader = pageheader;
			
			if(metaextra) result.metaextra = metaextra;
				
			var typeId = record.type;
			result.type = {
				id: typeId, 
				name: (typeId == CDS_Lib.CONST_LANDING_PAGE_TYPE_ID ? "landing" : "enhanced") 
			};
			
			cdsutil.endTime('main fields (caching)', true);
			
		}

		cdsutil.endTime('get (caching)', true);
		
		return result;
	},
	
	get: function (id, tag) {

		var cdsutil = new CDS_Lib.Utility();
		cdsutil.startTime('get');
		
		var pageId = id;
		cdsutil.startTime('nlapiLoadRecord');
		var record = nlapiLoadRecord("customrecord_ns_cd_page", pageId);
		cdsutil.endTime('nlapiLoadRecord', true);
		var result = {};
		var res, filters, columns;
		if (record) {
			
			cdsutil.startTime('main body');
			if ( context.getFeature('MULTISITE') && session.getSiteSettings().siteid ){
				var sites = record.getFieldValues("custrecord_ns_cdp_site");
				if (sites.indexOf(session.getSiteSettings().siteid.toString()) === -1){
					return {};
				}
			}		
			
			if(record.getFieldValue("custrecord_ns_cdp_status") != CDS_Lib.CONST_APPROVED_STATUS_ID){
				return {};
			}
			
			if(record.getFieldValue("isinactive") == 'T'){
				return {};
			}
			
			// load Main Body
			if(record.getFieldValue("custrecord_ns_cdp_type") == CDS_Lib.CONST_LANDING_PAGE_TYPE_ID){
				
	            var contentId = record.getFieldValue('custrecord_ns_cdp_mainbody'); 
	            if(contentId){
	            	var contentRec = nlapiLoadRecord('customrecord_ns_cd_content', contentId);
	            	var contentRecStatus = contentRec.getFieldValue('custrecord_ns_cdc_status');
	            	var contentRecActualContent = contentRec.getFieldValue('custrecord_ns_cdc_content');
	            	var contentRecFileId = contentRec.getFieldValue('custrecord_ns_cdc_file');
	            	
	            	if(contentRecStatus == CDS_Lib.CONST_APPROVED_STATUS_ID){
	            		if(contentRecFileId){
	            			var fileContentUtilUrl = nlapiResolveURL('SUITELET', 'customscript_cds_sl_loadfileutil', 'customdeploy_cds_sl_loadfileutil', true);
	            			var filecontent = nlapiRequestURL(fileContentUtilUrl + '&fileid=' + contentRecFileId).getBody();
	            			result.content = filecontent;
	            		}
	            		else{
	            			if(contentRecActualContent) result.content = contentRecActualContent;
	            		}		
	            	}
	            }
			}
			cdsutil.endTime('main body', true);
			cdsutil.startTime('page contents');						
			var pageContentIds = [];
			var pageContentLength = record.getLineItemCount('recmachcustrecord_ns_cdpc_pageid');
			for ( var i = 1; i <= pageContentLength ; i++) {
				var id = record.getLineItemValue('recmachcustrecord_ns_cdpc_pageid', 'id', i);
				pageContentIds.push(id);
			}
			
			result.pagecontent = [];
			if (pageContentIds.length) {
				
				filters = [
                   new nlobjSearchFilter('internalid', null, 'anyof', pageContentIds),
	               new nlobjSearchFilter('custrecord_ns_cdc_status', 'custrecord_ns_cdpc_contentid', 'is', CDS_Lib.CONST_APPROVED_STATUS_ID)
                ];
				
				columns = [
		           new nlobjSearchColumn('internalid').setSort(),
                   new nlobjSearchColumn('name', 'custrecord_ns_cdpc_contentid'),
                   new nlobjSearchColumn('custrecord_ns_cdpc_target'),
                   new nlobjSearchColumn('custrecord_ns_cdc_type', 'custrecord_ns_cdpc_contentid'),
                   new nlobjSearchColumn('custrecord_ns_cdc_status', 'custrecord_ns_cdpc_contentid'),
	               new nlobjSearchColumn('custrecord_ns_cdc_content', 'custrecord_ns_cdpc_contentid'),
	               new nlobjSearchColumn('custrecord_ns_cdc_merchid', 'custrecord_ns_cdpc_contentid'),
	               new nlobjSearchColumn('custrecord_ns_cdc_file', 'custrecord_ns_cdpc_contentid')
	            ];

	            res = nlapiSearchRecord('customrecord_ns_cd_pagecontent', null, filters, columns);
	            if(res){
	            	for(var i = 0; i < res.length; i++){
	    	            
		            	var obj = {};
		            	
		            	var id = res[i].getId();
//		            	var name = res[i].getValue('name', 'custrecord_ns_cdpc_contentid');
		            	var target = res[i].getValue('custrecord_ns_cdpc_target');
		            	var content = res[i].getValue('custrecord_ns_cdc_content', 'custrecord_ns_cdpc_contentid'); 
		            	var contentType = res[i].getValue('custrecord_ns_cdc_type', 'custrecord_ns_cdpc_contentid');
		            	var CONST_MERCHANDISING_RULE_ID = '2'; // see custom list 
		            	
		            	if(id) obj.id = id;
		            	
		            	if(target) obj.target = target;
		            	
		            	if(contentType == CONST_MERCHANDISING_RULE_ID){
		            		obj.contenttype = 'merchandising';
		            		var merchId = res[i].getValue('custrecord_ns_cdc_merchid', 'custrecord_ns_cdpc_contentid');
		            		obj.content = nlapiLookupField('customrecord_merch_rule', merchId, 'name');
//		            		obj.content = res[i].getText('custrecord_ns_cdc_merchid', 'custrecord_ns_cdpc_contentid'); // core bug?
		            	}
		            	else{
		            		obj.contenttype = 'html';
		            		
		            		// first workaround for the permission issue
//		            		var filecontent = res[i].getValue('custrecord_ns_cdc_filecontent', 'custrecord_ns_cdpc_contentid'); 
//		            		cdsutil.logger('DEBUG', 'alfred', 'filecontent = ' + JSON.stringify(filecontent));
//		            		if(filecontent){
//		            			obj.content = filecontent;
//		            		}
//		            		else{
//		            			if(content) obj.content = content;	
//		            		}
		            		
		            		// second workaround for the permission issue
		            		var file = res[i].getValue('custrecord_ns_cdc_file', 'custrecord_ns_cdpc_contentid'); 
		            		if(file){
		            			var fileContentUtilUrl = nlapiResolveURL('SUITELET', 'customscript_cds_sl_loadfileutil', 'customdeploy_cds_sl_loadfileutil', true);
		            			var filecontent = nlapiRequestURL(fileContentUtilUrl + '&fileid=' + file).getBody();
		            			obj.content = filecontent;
		            		}
		            		else{
		            			if(content) obj.content = content;
		            		}
		            	}
		            	
		            	result.pagecontent.push(obj); 
		            }	
	            }
			}
			cdsutil.endTime('page contents', true);
			cdsutil.startTime('main fields');	   			   					
			// main fields
			result.internalid = pageId;
			
			var templateId = record.getFieldValue("custrecord_ns_cdp_tplid"); 
			if (templateId) result.template = templateId;
			var tags = record.getFieldValues("custrecord_ns_cdp_tag");
			result.tags = [];
			if(tags){
				
				filters = [
                   new nlobjSearchFilter('internalid', null, 'anyof', tags)
                ];
				
				columns = [
		           new nlobjSearchColumn('internalid').setSort(),
                   new nlobjSearchColumn('name')
	            ];

	            res = nlapiSearchRecord('customrecord_ns_cd_tag', null, filters, columns);
				
				var tagList = [];
				
				for(var i = 0; i < tags.length; i++){
					tagList.push({
						id: res[i].getId(),
						name: res[i].getValue('name')
					});
				}
				
				result.tags = tagList;
			}			 
			
        	// get the first entry for now while there's no multi-language support
        	var title = record.getFieldValue("custrecord_ns_cdp_title");
			var metadescription = record.getFieldValue("custrecord_ns_cdp_metadescription");
			var metakeywords = record.getFieldValue("custrecord_ns_cdp_metakeywords");
			var pageheader = record.getFieldValue("custrecord_ns_cdp_pageheader");
			var metaextra = record.getFieldValue("custrecord_ns_cdp_metaextra");
			
			if(title) result.title = title;
			
			if(metadescription) result.metadescription = metadescription;
			
			if(metakeywords) result.metakeywords = metakeywords;
			
			if(pageheader) result.pageheader = pageheader;
			
			if(metaextra) result.metaextra = metaextra;
				
			var typeId = record.getFieldValue("custrecord_ns_cdp_type");
			result.type = {
				id: typeId, 
				name: (typeId == CDS_Lib.CONST_LANDING_PAGE_TYPE_ID ? "landing" : "enhanced") 
			};
			cdsutil.endTime('main fields', true);
			// for debugging only: start
//			result.targeturl = [];
//			filters = [
//               new nlobjSearchFilter('custrecord_ns_cdq_pageid', null, 'is', pageId)
//            ];
//
//            columns = [
//               new nlobjSearchColumn('internalid').setSort(),
//               new nlobjSearchColumn('custrecord_ns_cdq_query')
//            ];
//			
//            res = nlapiSearchRecord('customrecord_ns_cd_query', null, filters, columns);
//            if(res){
//            	for(var i = 0; i < res.length; i++){
//    	            
//	            	var obj = {};
//	            	
//	            	obj.id = res[i].getId();
//	            	obj.url = res[i].getValue('custrecord_ns_cdq_query');
//	            	
//	            	result.targeturl.push(obj); 
//	            }	
//            }
            // for debugging only: end	
		}
		cdsutil.endTime('get', true);
		return result;
	},
	
	getDefault:function ()
	{
		var filters = [
		    new nlobjSearchFilter("custrecord_ns_cdp_status","custrecord_ns_cdq_pageid","is", "1"),
		    new nlobjSearchFilter("custrecord_ns_cdq_query","","is", "*")
		];
		
		if ( context.getFeature('MULTISITE') && session.getSiteSettings().siteid ){ 
			filters.push( new nlobjSearchFilter('custrecord_ns_cdp_site', 'custrecord_ns_cdq_pageid', 'anyof', session.getSiteSettings().siteid) );
		}
		
		var columns = [	              
           new nlobjSearchColumn("custrecord_ns_cdq_pageid")
        ]; 
		
		var records = Application.getAllSearchResults("customrecord_ns_cd_query", filters, columns);
		
		if (records && records.length)
		{
			return this.get(records[0].getValue('custrecord_ns_cdq_pageid'));
		}
		return false;
	},
	
	// test url: http://shopping.netsuite.com/c.3498651/cds/services/url.ss?siteId=1&tags=device:mobile
	listURL: function (siteId, tags) {
		
		var result = [];
		
		var cdsutil = new CDS_Lib.Utility();
		
		if(!siteId){
			return [];
		}
		
		cdsutil.startTime('getTagIds');
		
		// get all tagIds
		var tagMap = {};
		var tagIds = new Array();
		if(tags){
			var tagArr = tags.split(',');
			
			for(var i = 0; i < tagArr.length; i++){
				var tagFilters = [
	               new nlobjSearchFilter('name', null, 'is', tagArr[i])
	            ];

	            columns = [
	               new nlobjSearchColumn('internalid'),
	               new nlobjSearchColumn('name')
	            ];
				
	            res = nlapiSearchRecord('customrecord_ns_cd_tag', null, tagFilters, columns);
	            if(res){
	            	
	            	// to prevent cases where tags = device:mobile,device:mobile,device:mobile
	            	tagMap[res[0].getId()] = 1;
	            }
	            else{
	            	// to handle cases where URL tag is non-existent in the system tags
	            	tagMap[-999] = 1; // dummy tag id
	            }
			}
			
			// get all keys in tagMap to get all distinct tagIds
			tagIds = Object.keys(tagMap);
		}
		cdsutil.endTime('getTagIds', true);
		
		// get all URLs based on siteId
		var pageRankEngine = new CDS_Lib.PageRankEngine();
		cdsutil.startTime('getAllDefaultPages');
		var defaultPages = pageRankEngine.getAllDefaultPages(siteId);
		cdsutil.endTime('getAllDefaultPages', true);
		cdsutil.startTime('filterUrlByTags');
		var filteredUrls = pageRankEngine.filterUrlByTags(siteId, tagIds);
		cdsutil.endTime('filterUrlByTags', true);
		cdsutil.startTime('generateJsonModel');
		result = pageRankEngine.generateJsonModel(defaultPages, filteredUrls);
		cdsutil.endTime('generateJsonModel', true);
		cdsutil.startTime('sort');
		// for QA automation: sort by query id
		result.sort(function(a,b) { 
			return parseFloat(a.id) - parseFloat(b.id); 
		}); 
		cdsutil.endTime('sort', true);

		return result;
	},
	
	
	listURLWithCaching: function (siteId, tags) {
		
		var result = [];
		var cacheName = '';
		
		var cdsutil = new CDS_Lib.Utility();
		
		if(!siteId){
			return [];
		}
		
		cdsutil.startTime('getTagIds (caching)');
		
		// get all tagIds
		var tagMap = {};
		var tagIds = new Array();
		if(tags){
			var tagArr = tags.split(',');
			
			for(var i = 0; i < tagArr.length; i++){
				cacheName = 'cds_tagnames';
				var cacheResult = cdsutil.lookupCache(cacheName, tagArr[i]);
				if(cacheResult == null){
					var tagFilters = [
		               new nlobjSearchFilter('name', null, 'is', tagArr[i])
		            ];

		            columns = [
		               new nlobjSearchColumn('internalid'),
		               new nlobjSearchColumn('name')
		            ];
					
		            res = nlapiSearchRecord('customrecord_ns_cd_tag', null, tagFilters, columns);
		            if(res){
		            	
		            	// to prevent cases where tags = device:mobile,device:mobile,device:mobile
		            	tagMap[parseInt(res[0].getId())] = 1;
		            	cdsutil.updateCache(cacheName, tagArr[i], res[0].getId(), cdsutil.cacheTtl);
		            }
		            else{
		            	// to handle cases where URL tag is non-existent in the system tags
		            	tagMap[-999] = 1; // dummy tag id
		            }	
				}
				else{
					tagMap[parseInt(cacheResult)] = 1;
				}
			}
			
			// get all keys in tagMap to get all distinct tagIds
			tagIds = Object.keys(tagMap);
			tagIds.sort(function(a,b) { 
				return parseInt(a) - parseInt(b); 
			}); 
		}
		cdsutil.endTime('getTagIds (caching)', true);
		
		// sort siteIds
		var siteIdArr = siteId.split(',');
		siteIdArr.sort(function(a,b) { 
			return parseInt(a) - parseInt(b); 
		}); 
		siteId = siteIdArr.join(',');
		
		// check cache for siteId & tags combination
		var cacheKey = siteId + ':' + tagIds.join(',');
		mainCacheName = 'cds_siteandtags';
		cdsutil.logger('DEBUG', cdsutil.logTitle, 'mainCacheName = ' + mainCacheName + ', cacheKey = ' + cacheKey);
		result = cdsutil.lookupCache(mainCacheName, cacheKey);
		if(result == null){
			// get all URLs based on siteId
			var pageRankEngine = new CDS_Lib.PageRankEngine();
			cdsutil.startTime('getAllDefaultPages (caching)');
			
			cacheName = 'cds_defaultpages';
			var defaultPages = cdsutil.lookupCache(cacheName, siteId);
			if(defaultPages == null){
				defaultPages = pageRankEngine.getAllDefaultPages(siteId);
				cdsutil.updateCache(cacheName, siteId, defaultPages, cdsutil.cacheTtl);
			}
			cdsutil.endTime('getAllDefaultPages (caching)', true);
			cdsutil.startTime('filterUrlByTags (caching)');
			var filteredUrls = pageRankEngine.filterUrlByTags(siteId, tagIds);
			cdsutil.endTime('filterUrlByTags (caching)', true);
			cdsutil.startTime('generateJsonModel (caching)');
			result = pageRankEngine.generateJsonModel(defaultPages, filteredUrls);
			cdsutil.endTime('generateJsonModel (caching)', true);
			cdsutil.startTime('sort (caching)');
			// for QA automation: sort by query id
			result.sort(function(a,b) { 
				return parseFloat(a.id) - parseFloat(b.id); 
			}); 
			cdsutil.endTime('sort (caching)', true);
			
			cdsutil.updateCache(mainCacheName, cacheKey, result, cdsutil.cacheTtl);
		}
		
		return result;
	},
	
	getByTemplate: function (template)
	{
		var returnMap = [];
		
		// search all NS CD Page filtered by Template ID, Status, and Site
		var filters = [
            new nlobjSearchFilter("custrecord_ns_cdp_status", null, "is", "1"),       
			new nlobjSearchFilter("custrecord_ns_cdp_tplid", null, "is", template),
		];
		// we can add language filtering in the above filters too
		
		if ( context.getFeature('MULTISITE') && session.getSiteSettings().siteid ){ 
			filters.push( new nlobjSearchFilter('custrecord_ns_cdp_site', null, 'anyof', session.getSiteSettings().siteid) );
		}
		
		var columns = [	
            new nlobjSearchColumn('internalid').setSort(),
			new nlobjSearchColumn("custrecord_ns_cdp_status"),
			new nlobjSearchColumn("custrecord_ns_cdp_tplid"),           
			new nlobjSearchColumn("custrecord_ns_cdp_type"),
			new nlobjSearchColumn("custrecord_ns_cdp_pageheader")
		];
		
		res = nlapiSearchRecord('customrecord_ns_cd_page', null, filters, columns);
		
		if(res){
        	for(var i = 0; i < res.length; i++){
        		var pageId = res[i].getId();
        		var pageHeader = res[i].getValue("custrecord_ns_cdp_pageheader");
        		var type = res[i].getValue("custrecord_ns_cdp_type");
        		
        		// search NS CD Query to get all URLs associated to pageId
        		var urlFilters = [
	      			new nlobjSearchFilter("custrecord_ns_cdq_pageid", null, "is", pageId)
	    		];
        		
        		var urlColumns = [	              
                  	new nlobjSearchColumn('internalid').setSort(),
		   			new nlobjSearchColumn("custrecord_ns_cdq_query")
		   		];
        		
        		urlRes = nlapiSearchRecord("customrecord_ns_cd_query", null, urlFilters, urlColumns);
                if(urlRes){
                	
                	for(var j = 0; j < urlRes.length; j++){
                		var obj = {};
                    	
                    	obj.id = urlRes[j].getId();
                    	obj.query = urlRes[j].getValue("custrecord_ns_cdq_query");
                    	obj.pageheader = pageHeader;
                    	obj.pageid = pageId;
                    	obj.type = type;
                    	
                    	returnMap.push(obj);	
                	}
                }
        	}
        }
		
        console.timeEnd("getByTemplate");
		console.log("Remaining Usage", nlapiGetContext().getRemainingUsage());	
		return returnMap;
	},
});
