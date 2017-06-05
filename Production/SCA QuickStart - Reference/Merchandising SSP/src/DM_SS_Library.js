/**
 * Library functions for Merchandising service.
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Nov 2012     esia/dembsucado
 * 2.00		  14 Dec 2012	  esia			   238213
 * 3.00		  21 Dec 2012	  esia			   238834
 * 4.00		  09 Jan 2013	  esia			   239771
 * 5.00		  09 Jan 2013	  esia			   239770
 * 6.00		  25 Jan 2013	  esia			   240256
 * 7.00		  28 Jan 2013	  esia			   241488
 * 8.00		  29 Jan 2013	  esia			   241588
 * 9.00		  07 Feb 2013	  esia			   242342
 * 10.00	  07 Feb 2013	  esia			   242339
 * 11.00	  26 Mar 2013	  esia			   243917
 * 12.00	  01 Apr 2013	  esia			   246386
 * 13.00	  04 Apr 2013	  esia			   247598
 * 14.00	  10 Apr 2013	  esia			   247962
 * 15.00	  11 Apr 2013	  esia			   248564
 * 16.00	  16 Apr 2013	  esia			   247963
 * 17.00	  17 Apr 2013	  esia			   249092
 * 18.00	  19 Apr 2013	  esia			   249353
 * 19.00	  06 Aug 2013	  jcrisostomo	   259458
 * 19.00	  07 Aug 2013	  jcrisostomo	   259599
 */

var psg_dm;
if (!psg_dm) { psg_dm = {}; }

/**
 * Get merchandising rules based on given zone parameter.
 * 
 * @param {String} zone merchandising Id from parameter
 * 
 * @returns {JSON} 
 */
psg_dm.getMerchRule = function(zone) {
	var MSG_TITLE = 'psg_dm.getMerchRules';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.getMerchRules: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n' 
			+ 'zone : ' + zone + '\n');	
	
	// If zone parameter has value, search for the merchandising rule associated with it.
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_is_approved', null, 'is', 'T');
	filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
	if (zone) {
		filters[2] = new nlobjSearchFilter('name', null, 'is', zone);		
	}

	// Merchandising Rule fields
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('name');
	columns[1] = new nlobjSearchColumn('custrecord_merch_title'),
	columns[2] = new nlobjSearchColumn('custrecord_merch_desc'),
	columns[3] = new nlobjSearchColumn('custrecord_no_of_results');
	columns[4] = new nlobjSearchColumn('custrecord_default_template');
	columns[5] = new nlobjSearchColumn('custrecord_site');
	columns[6] = new nlobjSearchColumn('custrecord_fieldset');
	columns[7] = new nlobjSearchColumn('custrecord_item_cart');
	columns[8] = new nlobjSearchColumn('custrecord_current_item');	
	columns[9] = new nlobjSearchColumn('custrecord_fieldset_id_rule');
	columns[10] = new nlobjSearchColumn('custrecord_apply_current_selections');
//	columns[11] = new nlobjSearchColumn('custrecord_display_rule');
	
	var result = nlapiSearchRecord('customrecord_merch_rule', null, filters, columns);
	
	var merchRule = {};
	if (result) {
		logger.debug(MSG_TITLE, 'result.length : ' + result.length + '\n');
		
		var merchRuleName = '';
		var merchRuleId = '';
		var site = '';
		var fieldset = '';
		for (var i in result) {
			merchRuleName = result[i].getValue('name');
			merchRuleId = result[i].getId();
			site = result[i].getText('custrecord_site');
			siteId = result[i].getValue('custrecord_site');

			var strRule = psg_dm.getRuleFromCache(merchRuleId, siteId);
			
			if(strRule != null){
				merchRule[merchRuleName] = JSON.parse(strRule);
				
				continue;
			}	
			
			fieldset = psg_dm.validateFieldset(result[i].getValue('custrecord_fieldset_id_rule'), site); 				
			// Check if fieldset is still active. 
			if (fieldset != '') {
				// Merchandising Rule
				merchRule[merchRuleName] = {
						title : result[i].getValue('custrecord_merch_title'),
						description : result[i].getValue('custrecord_merch_desc'),
						show : parseInt( result[i].getValue('custrecord_no_of_results') ),
						template : result[i].getValue('custrecord_default_template'),
						site : site,
						fieldset : fieldset				
//						displayrule : result[i].getValue('custrecord_display_rule'),
				};
				// Merchandising Locale
//				merchRule[merchRuleName].locale = psg_dm.getMerchLocale(merchRuleId);
				// Merchandising Filter
				merchRule[merchRuleName].filter = psg_dm.getMerchFilter(merchRuleId, site);
				// Apply on Current Selections on Filter sub tab
				merchRule[merchRuleName].within = (result[i].getValue('custrecord_apply_current_selections') == 'T') ? true : false;
				// Merchandising Sort
				merchRule[merchRuleName].sort = psg_dm.getMerchSort(merchRuleId, site);
				// Merchandising Exception (Items in Include sub tab)
//				merchRule[merchRuleName].include = psg_dm.getMerchIncludeItems(merchRuleId);
				// Merchandising Exception (Exclude sub tab)
				merchRule[merchRuleName].exclude = psg_dm.getMerchExclude(result[i].getValue('custrecord_current_item'), 
						result[i].getValue('custrecord_item_cart'));				
				
				psg_dm.putRuleToCache(merchRuleId, siteId, JSON.stringify(merchRule[merchRuleName]));
			}
		}
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.getMerchRules: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n');
	
	return merchRule;
}; // end psg_dm.getMerchRule

/**
 * Checks if fieldset of merchandising rule is active.
 * 
 * @param {String} fieldsetId fieldset Id of Website Fieldsets record
 * @param {String} site name of website record
 * 
 * @returns {String}  
 */
psg_dm.validateFieldset = function(fieldsetId, site) {
	var MSG_TITLE = 'psg_dm.validateFieldset';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.validateFieldset: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n' 
			+ 'fieldsetId : ' + fieldsetId + '\n'
			+ 'site : ' + site + '\n');	

	var filters = [ new nlobjSearchFilter('custrecord_fieldset_id', null, 'is', fieldsetId),
	            new nlobjSearchFilter('custrecord_site_name_fieldsets', null, 'is', site) ];	
	
	var columns = [ new nlobjSearchColumn('custrecord_active_fieldsets') ];
	
	var result = nlapiSearchRecord('customrecord_merch_website_fieldsets', null, filters, columns);
	var fieldset = '';
	if (result) {
		logger.debug(MSG_TITLE, 'result.length : ' + result.length + '\n'
				+ 'result[0].getId() : ' + result[0].getId() + '\n'
				+ 'isActive : ' + result[0].getValue('custrecord_active_fieldsets') + '\n');

		// Check if fieldset is active. If active, sets fieldset name.
		if ( result[0].getValue('custrecord_active_fieldsets') == 'T') {
			fieldset = fieldsetId;
		}
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.validateFieldset: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n');
	
	return fieldset;	
}; // end psg_dm.validateFieldset 

/**
 * Get Merchandising Locale fields for given merchandising rule. 
 */
//psg_dm.getMerchLocale = function(merchRuleId) {
//	var MSG_TITLE = 'psg_dm.getMerchLocale';
//	var logger = new psg_dm.logger(MSG_TITLE, false);	
//	logger.enable(); //comment this line to disable debug server log	
//	logger.debug(MSG_TITLE, 'START psg_dm.getMerchLocale: \n'  
//			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
//			+ '*************\n' 
//			+ 'merchRuleId : ' + merchRuleId + '\n');	
//
//	var filters = [ new nlobjSearchFilter('custrecord_merch_rule_name_locale', null, 'is', merchRuleId) ];
//
//	// Merchandising Filter fields
//	var columns = [ new nlobjSearchColumn('custrecord_language'),
//	                new nlobjSearchColumn('custrecord_merch_title'),
//	                new nlobjSearchColumn('custrecord_merch_desc') ];
//
//	var result = nlapiSearchRecord('customrecord_merch_locale', null, filters, columns);
//	var localeArray = [];
//	var merchRuleLocale = {};
//	if (result) {
//		logger.debug(MSG_TITLE, 'result.length : ' + result.length + '\n');	
//
//		for (var i in result) {
//			merchRuleLocale = {
//					language : result[i].getText('custrecord_language'),
//					title : result[i].getValue('custrecord_merch_title'),
//					description : result[i].getValue('custrecord_merch_desc')
//			};
//
//			localeArray.push(merchRuleLocale);
//		}
//	}
//	
//	logger.debug(MSG_TITLE, 'END psg_dm.getMerchLocale: \n'  
//			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
//			+ '*************\n');
//	
//	return localeArray;
//}; // end psg_dm.getMerchLocale

/**
 * Get Merchandising Filter fields for given merchandising rule. 
 * 
 * @param {String} merchRuleId merchandising rule record internal id
 * @param {String} site name of website record
 * 
 * @returns {merchRuleFilters[]} 
 */
psg_dm.getMerchFilter = function(merchRuleId, site) {
	var MSG_TITLE = 'psg_dm.getMerchFilter';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.getMerchFilter: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n' 
			+ 'merchRuleId : ' + merchRuleId + '\n'
			+ 'site : ' + site + '\n');	

	var filters = [ new nlobjSearchFilter('custrecord_merch_rule_name_filter', null, 'is', merchRuleId) ];

	// Merchandising Filter fields
	var columns = [ new nlobjSearchColumn('custrecord_field_id_filter'),
	                new nlobjSearchColumn('custrecord_filter_value'),
	                new nlobjSearchColumn('custrecord_filter_type'),
	                new nlobjSearchColumn('internalId').setSort() ];

	var result = nlapiSearchRecord('customrecord_merch_rule_filter', null, filters, columns);
	var filtersArray = [];
	var merchRuleFilters = {};
	if (result) {
		logger.debug(MSG_TITLE, 'result.length : ' + result.length + '\n');

		var websiteResult = [];
		var filterType = '';
		var filterValue = '';
		var filterValueArray = [];
		var numberRange = {};
		var decimalPlaces = 0;
		for (var i in result) {
//			filters = [ new nlobjSearchFilter('custrecord_filter_internal_id', null, 'is', result[i].getValue('custrecord_field_id_filter')),
//			            new nlobjSearchFilter('custrecord_site_name_filters', null, 'is', site) ];
//			
//			columns = [ new nlobjSearchColumn('custrecord_active_filters') ];
//			
//			websiteResult = nlapiSearchRecord('customrecord_merch_website_filters', null, filters, columns);
//			if (websiteResult) {
//				logger.debug(MSG_TITLE, 'websiteResult.length : ' + websiteResult.length + '\n'
//						+ 'websiteResult[0].getId() : ' + websiteResult[0].getId() + '\n'
//						+ 'isActive : ' + websiteResult[0].getValue('custrecord_active_filters') + '\n');
				// Check if Filter field is active.
//				if ( websiteResult[0].getValue('custrecord_active_filters') == 'T') {
					filterType = result[i].getValue('custrecord_filter_type');			
					filterValue = result[i].getValue('custrecord_filter_value');
					logger.debug(MSG_TITLE, 'filterType : ' + filterType + '\n'
							+ 'filterValue : ' + filterValue + '\n');					
					if (filterType == 'checkbox') {
						filterValue = filterValue.substring(3);
						filterValueArray = filterValue.split(' or ');
						for (var j in filterValueArray) {
							if (filterValueArray[j] == 'Current Selection') {
								filterValueArray[j] = '$current';
							} else if (filterValueArray[j] == 'Checked') {
								filterValueArray[j] = true;
							} else {
								filterValueArray[j] = false;
							}
						}
						merchRuleFilters = {
								field_id : result[i].getValue('custrecord_field_id_filter'),
								field_value : filterValueArray
						};
						
						filtersArray.push(merchRuleFilters);						
					} else if (filterType == 'currency' || filterType == 'currency2' || filterType == 'float' 
							|| filterType == 'integer' || filterType == 'posinteger') {
						// Create numberRange object.
						numberRange = {};
						if ( filterValue.indexOf('between') != -1 ) {														
							numberRange.from = filterValue.substring(11, filterValue.indexOf('and') - 1 );
							numberRange.to = filterValue.substring( filterValue.indexOf('and') + 4 );
						} else if ( filterValue.indexOf('greater') != -1 ) {
							numberRange.from = filterValue.substring( filterValue.indexOf('to') + 3 );
							numberRange.to = '*';
						} else if ( filterValue.indexOf('less') != -1 ) {
							numberRange.from = '*';
							numberRange.to = filterValue.substring( filterValue.indexOf('to') + 3 );							
						} else {
							filterValue = filterValue.substring( filterValue.indexOf('to') + 3 );
							numberRange.from = filterValue;
							numberRange.to = filterValue;							
						}
						
						filterValueArray = [];
						filterValueArray.push(numberRange);
						merchRuleFilters = {
								field_id : result[i].getValue('custrecord_field_id_filter'),
								field_value : filterValueArray
						};
						
						filtersArray.push(merchRuleFilters);
					} else if (filterType == 'percent') {
						// Create numberRange object based on decimal representation of the number in percent.
						numberRange = {};
						if ( filterValue.indexOf('between') != -1 ) {
							decimalPlaces = filterValue.substring(11, filterValue.indexOf('%')).split('.')[1].length + 2;
							numberRange.from = (parseFloat( filterValue.substring(11, filterValue.indexOf('%')) ) / 100).toFixed(decimalPlaces);
							
							decimalPlaces = filterValue.substring( filterValue.indexOf('and') + 4, filterValue.lastIndexOf('%') ).split('.')[1].length + 2;
							numberRange.to = (parseFloat( filterValue.substring( filterValue.indexOf('and') + 4 ) ) / 100).toFixed(decimalPlaces);
						} else if ( filterValue.indexOf('greater') != -1 ) {
							decimalPlaces = filterValue.substring( filterValue.indexOf('to') + 3, filterValue.indexOf('%') ).split('.')[1].length + 2;
							numberRange.from = (parseFloat( filterValue.substring( filterValue.indexOf('to') + 3, filterValue.indexOf('%') ) ) / 100).toFixed(decimalPlaces);
							
							numberRange.to = '*';
						} else if ( filterValue.indexOf('less') != -1 ) {							
							numberRange.from = '*';
							
							decimalPlaces = filterValue.substring( filterValue.indexOf('to') + 3, filterValue.indexOf('%') ).split('.')[1].length + 2;
							numberRange.to = (parseFloat( filterValue.substring( filterValue.indexOf('to') + 3, filterValue.indexOf('%') ) ) / 100).toFixed(decimalPlaces);							
						} else {
							filterValue = filterValue.substring( filterValue.indexOf('to') + 3, filterValue.indexOf('%') );
							decimalPlaces = filterValue.split('.')[1].length + 2;
							filterValue = (parseFloat(filterValue) / 100).toFixed(decimalPlaces);
							numberRange.from = filterValue;
							numberRange.to = filterValue;							
						}
						
						filterValueArray = [];
						filterValueArray.push(numberRange);
						merchRuleFilters = {
								field_id : result[i].getValue('custrecord_field_id_filter'),
								field_value : filterValueArray
						};
						
						filtersArray.push(merchRuleFilters);						
					} else if (filterType == 'multiselect' || filterType == 'select') {
						filterValue = filterValue.substring(10);
						filterValueArray = filterValue.split(' or ');
						for (var j in filterValueArray) {
							if (filterValueArray[j] == 'Current Selection') {
								filterValueArray[j] = '$current';
							}
						}
						merchRuleFilters = {
								field_id : result[i].getValue('custrecord_field_id_filter'),
								field_value : filterValueArray
						};
						
						filtersArray.push(merchRuleFilters);						
					}
//				}
//			}
		}	
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.getMerchFilter: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n');
	
	return filtersArray;
}; // end psg_dm.getMerchFilter

/**
 * Get Merchandising Sort fields for given merchandising rule. 
 * 
 * @param {String} merchRuleId merchandising rule record internal id
 * @param {String} site name of website record
 * 
 * @returns {merchRuleSort[]} 
 */
psg_dm.getMerchSort = function(merchRuleId, site) {
	var MSG_TITLE = 'psg_dm.getMerchSort';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.getMerchSort: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n' 
			+ 'merchRuleId : ' + merchRuleId + '\n'
			+ 'site : ' + site + '\n');	

	var filters = [ new nlobjSearchFilter('custrecord_merch_rule_name_sort', null, 'is', merchRuleId) ];

	// Merchandising Sort fields
	var columns = [ new nlobjSearchColumn('custrecord_field_id_sort'),
	                new nlobjSearchColumn('custrecord_sort_option'),
	                new nlobjSearchColumn('internalId').setSort() ];

	var result = nlapiSearchRecord('customrecord_merch_rule_sort', null, filters, columns);
	var sortArray = [];
	var merchRuleSort = {};
	if (result) {
		logger.debug(MSG_TITLE, 'result.length : ' + result.length + '\n');
	
		var websiteResult = [];
		var sortDir = '';
		for (var i in result) {
//			filters = [ new nlobjSearchFilter('custrecord_sort_internal_id', null, 'is', result[i].getValue('custrecord_field_id_sort')),
//			            new nlobjSearchFilter('custrecord_site_name_sorts', null, 'is', site) ];
//			
//			columns = [ new nlobjSearchColumn('custrecord_active_sorts') ];
//			
//			websiteResult = nlapiSearchRecord('customrecord_merch_website_sorts', null, filters, columns);
//			if (websiteResult) {
//				logger.debug(MSG_TITLE, 'websiteResult.length : ' + websiteResult.length + '\n'
//						+ 'websiteResult[0].getId() : ' + websiteResult[0].getId() + '\n'
//						+ 'isActive : ' + websiteResult[0].getValue('custrecord_active_sorts') + '\n');
				// Check if Sort field is active.
//				if ( websiteResult[0].getValue('custrecord_active_sorts') == 'T') {
					sortDir = result[i].getText('custrecord_sort_option');
					if (sortDir == 'Ascending') {
						sortDir = 'asc';
					} else if (sortDir == 'Descending') {
						sortDir = 'desc';
					}
					
					merchRuleSort = {
							field_id : result[i].getValue('custrecord_field_id_sort'),
							dir : sortDir
					};
					
					sortArray.push(merchRuleSort);					
//				}
//			}
		}	
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.getMerchSort: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n');
	
	return sortArray;
}; // end psg_dm.getMerchSort

/**
 * Get Merchandising Include items (Exception) for given merchandising rule. 
 */
//psg_dm.getMerchIncludeItems = function(merchRuleId) {
//	var MSG_TITLE = 'psg_dm.getMerchIncludeItems';
//	var logger = new psg_dm.logger(MSG_TITLE, false);	
//	logger.enable(); //comment this line to disable debug server log	
//	logger.debug(MSG_TITLE, 'START psg_dm.getMerchIncludeItems: \n'  
//			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
//			+ '*************\n' 
//			+ 'merchRuleId : ' + merchRuleId + '\n');	
//
//	var filters = [ new nlobjSearchFilter('custrecord_merch_rule_name_exception', null, 'is', merchRuleId) ];
//
//	// Merchandising Include items
//	var columns = [ new nlobjSearchColumn('custrecord_item') ];
//
//	var result = nlapiSearchRecord('customrecord_merch_rule_exception', null, filters, columns);
//	var itemsArray = [];
//	var merchRuleItems = {};
//	if (result) {
//		logger.debug(MSG_TITLE, 'result.length : ' + result.length + '\n');
//		
//		for (var i in result) {
//			merchRuleItems = {
//					item : result[i].getText('custrecord_item')
//			};
//
//			itemsArray.push(merchRuleItems);
//		}		
//	}
//	
//	logger.debug(MSG_TITLE, 'END psg_dm.getMerchIncludeItems: \n'  
//			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
//			+ '*************\n');
//	
//	return itemsArray;
//}; // end psg_dm.getMerchIncludeItems

/**
 * Get Merchandising Exclude (Exception) for given merchandising rule. 
 * 
 * @param {String} currentSelection value of current item shopper is viewing checkbox
 * @param {String} cartItems value of items in car checkbox
 * 
 * @returns {Array}  
 */
psg_dm.getMerchExclude = function(currentSelection, cartItems) {
	var MSG_TITLE = 'psg_dm.getMerchExclude';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.getMerchExclude: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n' 
			+ 'currentSelection : ' + currentSelection + '\n'
			+ 'cartItems : ' + cartItems + '\n');	

	var excludeArray = [];
	
	if (currentSelection == 'T') {
		excludeArray.push('$current');
	}
	
	if (cartItems == 'T') {
		excludeArray.push('$cart');
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.getMerchExclude: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n'
			+ 'excludeArray.length : ' + excludeArray.length + '\n');
	
	return excludeArray;	
}; //end psg_dm.getMerchExclude

/**
 * Logging facility.
 */
psg_dm.logger = function(logTitle, isClientside, isEnabled) {
    // Logger Constants  
    var startLogMessage     = '=====Start=====';
    var endLogMessage       = '======End======';
    var setStartLogMessage  = function(newStartLogMessage) { startLogMessage = newStartLogMessage;  }; 
    var setEndLogMessage    = function(newEndtLogMessage)  { endLogMessage   = newEndLogMessage;    };
     
    this.getStartLogMessage = function() { return startLogMessage;  }; 
    this.getEndLogMessage   = function() { return endLogMessage;    }; 
    
    // logTitle manipulation 
    var logTitle           = logTitle;
    this.setLogTitle       = function(newLogTitle) { logTitle = newLogTitle;  };
    this.getLogTitle       = function() { return logTitle;  }; 

    // Determines whether to print a log or display an alert message 
    var isClientside       = (!isClientside) ? false : isClientside;  
    var isForceClientside  = false; 
    
    this.forceClientside   = function() { isForceClientside = true;  };          // Force Client Side logging via alerts
    this.unforceClientside = function() { isForceClientside = false; };          // Unforce Client Side logging via alerts
    
    // Defines the logLevel similar to that of log4j  
    var ALL        = 0; // The ALL has the lowest possible rank and is intended to turn on all logging.
    var AUDIT      = 1; // The AUDIT Level designates finer-grained informational events than the DEBUG
    var DEBUG      = 2; // The DEBUG Level designates fine-grained informational events that are most useful to debug an application.
    var ERROR      = 3; // The ERROR level designates error events that might still allow the application to continue running.
    var EMERGENCY  = 4; // The EMERGENCY level designates very severe error events that will presumably lead the application to abort.
    var OFF        = 5; // The OFF has the highest possible rank and is intended to turn off logging.

    var LOG_LEVELS = new Array('ALL', 'AUDIT', 'DEBUG', 'ERROR', 'EMERGENCY', 'OFF');
    var logLevel   = OFF; // current log level - default is OFF

    // Convenience method to set log level to ALL, AUDIT, DEBUG, ERROR, EMERGENCY and OFF 
    this.setLogLevelToAll       = function() { logLevel = ALL;       };
    this.setLogLevelToAudit     = function() { logLevel = AUDIT;     };
    this.setLogLevelToDebug     = function() { logLevel = DEBUG;     };
    this.setLogLevelToError     = function() { logLevel = ERROR;     };
    this.setLogLevelToEmergency = function() { logLevel = EMERGENCY; };
    this.setLogLevelToOff       = function() { logLevel = OFF;       };
     
    this.enable   = function() { this.setLogLevelToAll(); };                     // Enable the logging mechanism
    this.disable  = function() { this.setLogLevelToOff(); };                     // Disable the logging mechanism
    if (!isEnabled) {
        this.disable();
    } else {
        if (isEnabled == true) this.enable();
    }  

    // Facility for pretty-fying the output of the logging mechanism
    var TAB             = '\t';                                                 // Tabs
    var SPC             = ' ';                                                  // Space
    var indentCharacter = SPC;                                                  // character to be used for indents: 
    var indentations    = 0;                                                    // number of indents to be padded to message
    
    this.indent   = function() { indentations++; };
    this.unindent = function() { indentations--; };

    // Prints a log either as an alert for CSS or a server side log for SSS
	this.log = function (logType, newLogTitle, logMessage) {
        // Pop an alert window if isClientside or isForceClientside  
        if ((isClientside) || (isForceClientside)) {
            alert(LOG_LEVELS[logType] + ' : ' + newLogTitle + ' : ' + logMessage);
        }

        // Prints a log message if !isClientside 
        if (!isClientside) {                                                    
            for (var i = 0; i < indentations; i++) { 
                logMessage = indentCharacter + logMessage;
            }
            logMessage = '<pre>' + logMessage + '</pre>';
            nlapiLogExecution(LOG_LEVELS[logType], newLogTitle, logMessage);
        }
    };
    
    // Validates the log parameter before calling tha actual log function
	this.validateParamsThenLog = function(logType, newLogTitle, logMessage) {
        if (!logType) logType = EMERGENCY;                                      // default logType to EMERGENCY - minimal log messages
        if (logLevel > logType) return;                                         // current logLevel does not accomodate logType 
    
        if (newLogTitle && !logMessage) {                                       // If newLogTitle exist and logMessage is undefined, 
            logMessage  = newLogTitle;                                          // then the newLogTitle should be displayed as the logMessage
            newLogTitle = null;
        }
        
        if (!newLogTitle) newLogTitle = logTitle;
        this.log(logType, newLogTitle, logMessage);
    }; 

    // Convenience method to log a AUDIT, DEBUG, INFO, WARN, ERROR and EMERGENCY messages
    this.audit     = function(newLogTitle, logMessage) { this.validateParamsThenLog(AUDIT,     newLogTitle, logMessage); };
    this.debug     = function(newLogTitle, logMessage) { this.validateParamsThenLog(DEBUG,     newLogTitle, logMessage); };
    this.error     = function(newLogTitle, logMessage) { this.validateParamsThenLog(ERROR,     newLogTitle, logMessage); };
    this.emergency = function(newLogTitle, logMessage) { this.validateParamsThenLog(EMERGENCY, newLogTitle, logMessage); };
}; // end psg_dm.logger
 
/**
 *  Retrieves the stored merchandising rule (JSON) from cache given the merchandising rule id and site id 
 *  
 *  @param {number} merchandising rule internal id
 *  @param {number} site internal id
 *  
 *  @returns {String} returns the JSON string if found in cache, else returns null
 */
psg_dm.getRuleFromCache = function(merchRuleId, site){
	var MSG_TITLE = 'psg_dm.getRuleFromCache';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.getRuleFromCache: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n' 
			+ 'merchRuleId : ' + merchRuleId + '\n'
			+ 'site : ' + site + '\n');
	
	var cacheValue = null;
	
	if(merchRuleId && site){
	var key = merchRuleId + '-' + site;
	cacheValue = cacheUtil.get(key);
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.getRuleFromCache: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n'
			+ 'cacheValue : ' + cacheValue + '\n');
	
	return cacheValue;
};

/**
 *  Puts into the cache the merchandising rule JSON string
 *  
 *  @param {number} merchandising rule internal id
 *  @param {number} site internal id
 *  @param {String} JSON value to be stored
 *  
 */
psg_dm.putRuleToCache = function(merchRuleId, site, value){
	var MSG_TITLE = 'psg_dm.putRuleToCache';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.putRuleToCache: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n' 
			+ 'merchRuleId : ' + merchRuleId + '\n'
			+ 'site : ' + site + '\n'
			+ 'value : ' + value + '\n');
	
	if(merchRuleId && site && value){
	var key = merchRuleId + '-' + site;
	cacheUtil.put(key, value);
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.putRuleToCache: \n'  
			+'nlapiGetContext().getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\n'
			+ '*************\n');
};

/**
 * Get the paramater from the http request. The parameter is case insensitive.
 * If there are multiple parameters with the same name, the value of the first match will be returned.
 * 
 * @param {String[]} name-value pairs returned by the nlobjRequest.getAllParameters() call
 * @param {String} the name of the parameter whose value will be returned
 * 
 * @returns {String} the parameter value
 */
psg_dm.getParameter = function(paramArray, paramToGet){
	var MSG_TITLE = 'psg_dm.getParameter';
	var logger = new psg_dm.logger(MSG_TITLE, false);	
	logger.enable(); //comment this line to disable debug server log	
	logger.debug(MSG_TITLE, 'START psg_dm.getParameter: \n'  
			+ '*************\n' 
			+ 'paramToGet : ' + paramToGet + '\n');
	
	var paramValue = null;
	
	if(paramArray != null && paramToGet != null){
		for(var param in paramArray){
			if (param.toUpperCase() == paramToGet.toUpperCase()){
				paramValue = paramArray[param];
				break;
			}
		}
	}
	
	logger.debug(MSG_TITLE, 'END psg_dm.getParameter: \n'  
			+ '*************\n'
			+ 'paramValue : ' + paramValue + '\n');			
		
	return paramValue;
};

// CACHE UTILITY

var cacheUtility = function(sCacheName){
	var MAX_TTL = 7200; // 2 hours maximum time to live
	var MIN_TTL = 300; // 5 minutes minimum time to live
	var missed = 0;		// total cache misses (i.e. nlobjCache.get() returns a null)
	var hit = 0;		// total cache hits (i.e. nlobjCache.get() returns a value)
	var update = 0;	// total calls to nlobjCache.put()
	var total = 0;		// total calls to cacheUtility.get()
	var cacheName = null;	// the name used when the cache is retrieved using nlapiGetCache()
	var cache = null;	// will be holding the reference to the cache (to minimize calls to nlapiGetCache)
	var ttl = MAX_TTL;	// (seconds) the length of time that a key-value pair is stored in the cache
	
	var logger = new psg_dm.logger('cacheUtility', false);
	logger.enable();
	
	useCache(sCacheName);
	
	/**
	 * Retrieves the value stored in the cache given the key.
	 * @param key unique identifier in a cache
	 * @returns a value when the key is found, returns null otherwise
	 */
	function get(key){
		increaseTotal();
		var value = null;
		
		if(cache != null){
			try{
				if(key != null){
					value = cache.get(key);
					if(value != null){
						increaseHit();
					}else{
						increaseMissed();
					}
				}
			}catch(e){
				
				if(e instanceof nlobjError){
					logger.error('cacheUtility.get()', e.getCode() + '\n' + e.getDetails());
				}else{
					logger.error('cacheUtility.get()', e.toString());
				}
				return null;
			}
		}
		
		return value;
	}
	
	/**
	 * Stores a key-value pair in the cache. The amount of time before this pair is purged from the cache is set using setTTL()
	 * @param key unique identifier in a cache
	 * @param value the value to be stored 
	 * @returns 1 when nlobjCache.put() throws no exceptions, returns null when there are missing parameters or an exception is thrown
	 */
	function put(key, value){
		var ret = null;
		
		if(cache != null){
			try{
				if(key != null && value != null){
					var putReturn = cache.put(key, value, getTTL());
					if(putReturn != null){
						if(putReturn.status == 'SUCCESS'){
							ret = 1;
							increaseUpdate();
						}
					}
				}
			}catch(e){
				if(e instanceof nlobjError){
					logger.error('cacheUtility.put()',  e.getCode() + '\n' + e.getDetails());
				}else{
					logger.error('cacheUtility.put()', e.toString());
				}
				
				return null;
			}
		}
		
		return ret;
	}
	
	/**
	 * This sets the ttl variable. After setTTL is called, the succeeding calls to cacheUtility.put() will use this ttl value.
	 * TTL is the length of time that a value is stored in the cache. 
	 * @param sec
	 */
	function setTTL(paramValue){
		//ttl is not defined
		if(paramValue == null || paramValue == undefined || paramValue == ''){
			ttl = MAX_TTL;
			return ttl;
		}
		
		//ttl is defined but invalid
		var paramValueInt = parseInt(paramValue);
		if(isNaN(paramValueInt) || paramValueInt < MIN_TTL || paramValueInt > MAX_TTL){
			ttl = MAX_TTL;
			return ttl;
		}
		else{
			ttl = paramValueInt;
			return paramValueInt;	
		}
	}
	
	/**
	 * Sets the cache that cacheUtility will be using. Each cache is identified by a name.
	 * @param name a string that identifies the cache
	 * @returns 1 on success, null when it fails
	 */
	
	function useCache(name){
		ret = null;
		
		if(name != null){
			cacheName = name;
			try{
				cache = nlapiGetCache(cacheName);
				if (cache != null) ret = 1;
			}catch(e){
				if(e instanceof nlobjError){
					logger.error('cacheUtility.useCache()',  e.getCode() + '\n' + e.getDetails());
				}else{
					logger.error('cacheUtility.useCache()', e.toString());
				}
				return ret;
			}
		}
		return ret;
	}
	
	function getCacheName(){ return cacheName; }
	
	function getHit(){ return hit; }
	
	function getMissed(){ return missed; }
	
	function getUpdate(){ return update; }
	
	function getTTL(){ return ttl; }
	
	function getTotal(){return total;}
	
	/**
	 * Increases the value of the 'missed' variable. This keeps track of the number of times that nlobjCache.get() returns a value
	 * @param num if there is no parameter, the default increase is 1.
	 */
	function increaseMissed(num){
		if(num != null){
			missed += num;
		}else{
			missed++;
		}
	}
	
	/**
	 * Increases the value of the 'hit' variable. This keeps track of the number of times that nlobjCache.get() returns a null
	 * @param num if there is no parameter, the default increase is 1.
	 */
	function increaseHit(num){
		if(num != null){
			hit += num;
		}else{
			hit++;
		}
	}

	/**
	 * Increases the value of the 'hit' variable. This keeps track of the number of times that nlobjCache.get() returns a null
	 * @param num if there is no parameter, the default increase is 1.
	 */
	function increaseUpdate(num){
		if(num != null){
			update += num;
		}else{
			update++;
		}
	}
	
	/**
	 * Increases the value of the 'total' variable. This keeps track of the number of times that the cacheUtility.get() function is called
	 * @param num if there is no parameter, the default increase is 1.
	 */
	function increaseTotal(num){
		if(num != null){
			total += num;
		}else{
			total++;
		}
	}
	
	return{
		getCacheName:getCacheName,
		getHit: getHit,
		getMissed: getMissed,
		getUpdate: getUpdate,
		getTTL:getTTL,
		getTotal: getTotal,
		get: get,
		put: put,
		setTTL: setTTL,
		useCache:useCache
	};
};

var cacheUtil = cacheUtility('MerchandisingCache');