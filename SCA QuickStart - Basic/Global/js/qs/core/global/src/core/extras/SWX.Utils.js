(function ()
{
	'use strict';

	// Global Constants
	var SUITEREST_URL = '/app/site/hosting/scriptlet.nl?script=154&deploy=1&compid=3857857&h=70494400753de3ffe57b';
	var DESIGN_OPTIONS_JSON_URL = '/c.3857857/shopflow/js/DesignOptions_Config.json';
	//var DESIGN_OPTIONS_JSON_URL = '/SSP%20Applications/SCA%20QuickStart%20-%20Basic/Global/js/DesignOptions_Config.json';
	
	var ARR_CUSTOM_COLUMN_DESIGNOPTIONS_IDS = ['custcol_designoptions_jacket', 'custcol_designoptions_overcoat', 'custcol_designoptions_shirt', 'custcol_designoptions_trouser', 'custcol_designoptions_waistcoat'];

	var $ = jQuery;

	// ====================== start Prototype Utilities ======================
	
	// Function to check if array element exist
	Array.prototype.inArray = function(valueStr)
	{
		try
		{
			 var convertedValueStr = valueStr.toString();
			 for(var i = 0; i < this.length; i++)
			 {
				 if (this[i] === convertedValueStr)
				 
				 return true;
			 }
		  
		}
		  catch(ex)
		{
		  
		}
	
	
		return false;
	};
	
	
	Object.size = function(obj) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};
	
	String.prototype.trim = function() 
	{
		return this.replace(/^\s+|\s+$/g,"");
	}
	String.prototype.ltrim = function() 
	{
		return this.replace(/^\s+/,"");
	}
	String.prototype.rtrim = function() 
	{
		return this.replace(/\s+$/,"");
	}
	
	String.prototype.replaceAll = function(valueStr, replacewith) 
	{
		var s = this;
		while (s.indexOf(valueStr) >= 0)
		s = s.replace(valueStr, replacewith);
		return s;
	}
	
	String.prototype.remove = function(valueStr) 
	{ 
		return this.replaceAll(valueStr, ''); 
	}
	
	String.prototype.contains = function(valueStr) 
	{ 
		return this.indexOf(valueStr) != -1; 
	};
	
	Array.prototype.sortByProp = function(p){
	 return this.sort(function(a,b){
	  return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
	 });
	}
	
	Number.prototype.between = function(first,last){
		return (first < last ? this >= first && this <= last : this >= last && this <= first);
	}
	
	Array.prototype.sortByObjKey = function(p, pattern)
	{
		switch(pattern)
		{
			case 'ASC':
				return this.sort(function(a,b){ return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0; });
			break;
		
			case 'DESC':
				return this.sort(function(a,b){ return (a[p] < b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0; }); break;
			break;
		
			default: return this.sort(function(a,b){ return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0; });
		}
	}
	
	// ====================== end Prototype Utilities ======================


	// start D.A.
	function isNullOrEmpty(valueStr)
	{
	   return(valueStr == null || valueStr == "" || valueStr == undefined); 
	}
	
	function isNullOrEmptyObject(obj) 
	{
	   var hasOwnProperty = Object.prototype.hasOwnProperty;
	   
	   if (obj.length && obj.length > 0) { return false; }   
	   for (var key in obj) { if (hasOwnProperty.call(obj, key)) return false; }
	   return true;
	}

	function isObjectExist(objFld)
	{
	   var isObjExist = (typeof objFld != "undefined") ? true : false;
	   return isObjExist;
	}

	function replaceChars(valusStr, out, add) 
	{
		temp = '' + valusStr; // temporary holder
		
		while (temp.indexOf(out) > -1) 
		{
			pos= temp.indexOf(out);
			temp = "" + (temp.substring(0, pos) + add + 
			temp.substring((pos + out.length), temp.length));
		}
		return temp;
	}

	function getUrlVars()
	{
		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) { try {vars[key] = value; } catch(xj) { vars = ''} });	
		return vars;
	}

	function getUrlParameterValue(paramUrlParam)
	{
		var functionName = 'getUrlParameterValue';
		var retStr = '';
		
		try
		{
			retStr = getUrlVars()['' + paramUrlParam + ''];
			retStr = (!isNullOrEmpty(retStr)) ? retStr : '';
		}
			catch(ex)
		{
			consoleLog('Error in ' + functionName + ':' + '\n' +ex.toString())
			retStr = '';
		}
		return retStr;
	}

	function getDesignOptionsJsonUrl()
	{
		return DESIGN_OPTIONS_JSON_URL;
	}
	
	
	function toggleMobileNavButt()
	{
		var $ = jQuery;
		
		$(function()
		{
			console.log( "ready!" );
			
			var $ = jQuery;
			
			var isButtMobileToggleVisible = $("[class='navbar navbar-inverse mobile-nav']").find("span[class='icon-bar']").is(":visible");
			var isDisplayInMobileOnly = (isButtMobileToggleVisible) ? true : false;
			var isDisplayInDesktopOnly = (!isButtMobileToggleVisible) ? true : false;

			// On Load
			if (isDisplayInMobileOnly)
			{
				$("[id='mobile-only']").show();
				$("[id='desktop-only']").hide();
			}
	
			if (isDisplayInDesktopOnly)
			{
				$("[id='mobile-only']").hide();
				$("[id='desktop-only']").show();
			}
			
			console.log( "on load" );
	
			// On Window Resize
	
			$(window).resize(function()
			{
				
				console.log( "window resize" );
				var isButtMobileToggleVisible = $("[class='navbar navbar-inverse mobile-nav']").find("span[class='icon-bar']").is(":visible");
				var isDisplayInMobileOnly = (isButtMobileToggleVisible) ? true : false;
				var isDisplayInDesktopOnly = (!isButtMobileToggleVisible) ? true : false;
				
				if (isDisplayInMobileOnly)
				{
					$("[id='mobile-only']").show();
					$("[id='desktop-only']").hide();
				}
	
				if (isDisplayInDesktopOnly)
				{
					$("[id='mobile-only']").hide();
					$("[id='desktop-only']").show();
	
				}
			});


		});
	}

	function getArrObjOrderClientList(paramArrObjClientList, paramObjFilters)
	{
		var retArrObj = [];
		var filterName = '';
		var filterEmail = '';
		var filterPhone = '';
		
		var hasFilters = false;
		var hasFilterName = false;
		var hasFilterEmail = false;
		var hasFilterPhone = false;

		var arrObjClientList = paramArrObjClientList;
		var objFilters = paramObjFilters;
		
		var arrObjClientListTotal = (!isNullOrEmpty(arrObjClientList)) ? arrObjClientList.length : 0;
		var hasArrObjClientList = (arrObjClientListTotal != 0) ? true : false;
		
		var hasObjFilters = (!isNullOrEmptyObject(objFilters)) ? true : false;
		
		if (hasObjFilters)
		{
			filterName = (isObjectExist(objFilters['name'])) ? $.trim(objFilters['name']) : '';
			filterEmail = (isObjectExist(objFilters['email'])) ? $.trim(objFilters['email']) : '';
			filterPhone = (isObjectExist(objFilters['phone'])) ? $.trim(objFilters['phone']) : '';
		}
		
		hasFilterName = (!isNullOrEmpty(filterName)) ? true : false;
		hasFilterEmail = (!isNullOrEmpty(filterEmail)) ? true : false;
		hasFilterPhone = (!isNullOrEmpty(filterPhone)) ? true : false;
		hasFilters = (hasFilterName || hasFilterEmail || hasFilterPhone) ? true : false;
		
		try
		{
			if (hasArrObjClientList && hasFilters)
			{
				filterName = (hasFilterName) ? filterName.toUpperCase() : '';
				filterEmail = (hasFilterEmail) ? filterEmail.toUpperCase() : '';
				filterPhone = (hasFilterPhone) ? replaceChars(filterPhone, ' ', '').toUpperCase() : '';
				
				var arrFilterName = (hasFilterName) ? filterName.split(' ') : [];
				var arrFilterNameTotal = (!isNullOrEmpty(arrFilterName)) ? arrFilterName.length : 0;
				var hasArrFilterName = (arrFilterNameTotal != 0) ? true : false;
				
				for (var dx = 0; dx < arrObjClientListTotal; dx++)
				{
					var isAlreadyAdded = false;
					var refFirstNameValue = (!isNullOrEmpty(arrObjClientList[dx]['custrecord_tc_first_name'])) ?  replaceChars($.trim(arrObjClientList[dx]['custrecord_tc_first_name']), ' ', '').toUpperCase() : '';
					var refLastNameValue = (!isNullOrEmpty(arrObjClientList[dx]['custrecord_tc_last_name'])) ? replaceChars($.trim(arrObjClientList[dx]['custrecord_tc_last_name']), ' ', '').toUpperCase() : '';
					var refEmailValue = (!isNullOrEmpty(arrObjClientList[dx]['custrecord_tc_email'])) ?  $.trim(arrObjClientList[dx]['custrecord_tc_email']).toUpperCase() : '';
					var refPhoneValue = (!isNullOrEmpty(arrObjClientList[dx]['custrecord_tc_phone'])) ?  replaceChars($.trim(arrObjClientList[dx]['custrecord_tc_phone']), ' ', '').toUpperCase() : '';
					var hasRefFirstName = (!isNullOrEmpty(refFirstNameValue)) ? true : false;
					var hasRefLastName = (!isNullOrEmpty(refLastNameValue)) ? true : false;
					var hasRefEmail = (!isNullOrEmpty(refEmailValue)) ? true : false;
					var hasRefPhone = (!isNullOrEmpty(refPhoneValue)) ? true : false;
					
					if (!isAlreadyAdded && hasFilterName)
					{
						if (!isAlreadyAdded && hasArrFilterName)
						{
							/**
							for (var xj = 0; xj < arrFilterNameTotal; xj++)
							{
								var stFilterName = arrFilterName[xj];
								
								if (!isAlreadyAdded && refFirstNameValue.indexOf(stFilterName) >= 0)
								{
									retArrObj.push(arrObjClientList[dx]);
									isAlreadyAdded = true;
								}

								if (!isAlreadyAdded && refLastNameValue.indexOf(stFilterName) >= 0)
								{
									retArrObj.push(arrObjClientList[dx]);
									isAlreadyAdded = true;
								}
							}
							**/
							
							for (var xj = 0; xj < arrFilterNameTotal; xj++)
							{
								var stFilterName = arrFilterName[xj];
								
								if (!isAlreadyAdded && stFilterName == refFirstNameValue)
								{
									retArrObj.push(arrObjClientList[dx]);
									isAlreadyAdded = true;
								}

								if (!isAlreadyAdded && stFilterName == refLastNameValue)
								{
									retArrObj.push(arrObjClientList[dx]);
									isAlreadyAdded = true;
								}
							}
						}
					}

					if (!isAlreadyAdded && hasFilterEmail)
					{
						//if (refEmailValue.indexOf(filterEmail) >= 0)
						if (refEmailValue == filterEmail)
						{
							retArrObj.push(arrObjClientList[dx]);
							isAlreadyAdded = true;
						}
					}

					if (!isAlreadyAdded && hasFilterPhone)
					{
						if (refPhoneValue.indexOf(filterPhone) >= 0)
						{
							retArrObj.push(arrObjClientList[dx]);
							isAlreadyAdded = true;
						}
					}
					
				}
			}
		}
			catch(ex)
		{
			console.log('Error in getArrObjOrderClientList function: '  + '\n' + ex.tostring())
			retArrObj = [];
		}
		return retArrObj;
	}

	function suiteRest(paramObjFunctionName, paramObjInputData)
	{
		var functionName = 'suiteRest';
		var objDataResponse = '';
		var objRef = '';
		var stFuncName = paramObjFunctionName;
		var objInputData =  paramObjInputData;
		var inputJSON = {'func' : stFuncName, 'data' : objInputData};
		var JSONtoSend = JSON.stringify(inputJSON);

		var processAjaxData = $.ajax
			({    
				url: SUITEREST_URL + '&inputJson=' + JSONtoSend,    
				type: "GET",    
				dataType: "json",    
				contentType: "application/json",
				cache:false,
				error: function(jqXHR, textStatus, errorThrown)
				{
					console.log('Ajax Error: ' + errorThrown)
				},
				async: true,
				success: function (jsonResponse)
				{                               
					//var objResponseRef = jsonResponse;
					//var isSuccessResponse = (!isNullOrEmpty(objResponseRef['success']) && objResponseRef['success'] == 'T') ? true : false;

				}
			});

		/**
		var processAjaxData = $.ajax
			({    
				url: SUITEREST_URL + '&inputJson=' + JSONtoSend
				, method: "GET"
				//, data: JSONtoSend
			});
		**/
		return 	processAjaxData
	}

	function getArrObjFilteredSaveForLaterItems(paramArrObjItems, paramStFilters)
	{
		var retArrObj = [];
		var arrObjItems = paramArrObjItems;
		var arrObjItemsTotal = (!isNullOrEmpty(arrObjItems)) ? arrObjItems.length : 0;
		var hasArrObjItems = (arrObjItemsTotal != 0) ? true : false;
		var stFilter = paramStFilters;
		var hasStFilter = (!isNullOrEmpty(stFilter)) ? true : false;
		
		try
		{
			if (hasArrObjItems && hasStFilter)
			{
				stFilter = stFilter.toUpperCase()
				for (var dx = 0; dx < arrObjItemsTotal; dx++)
				{
					var isAlreadyAdded = false;
					var isObjKeyClientExist = (isObjectExist(arrObjItems[dx]['client'])) ? true : false;
					
					if (isObjKeyClientExist)
					{
						var objClient = arrObjItems[dx]['client'];
						var clientFirstName = (!isNullOrEmpty(objClient['firstname'])) ? objClient['firstname'] : '';
						var clientLastName = (!isNullOrEmpty(objClient['lastname'])) ? objClient['lastname'] : '';
						
						var hasClientFirstName = (!isNullOrEmpty(clientFirstName)) ? true : false;
						var hasClientLastName = (!isNullOrEmpty(clientLastName)) ? true : false;
						
						var stFilterSplit = stFilter.split(' ');
						var stFilterSplitTotal = (!isNullOrEmpty(stFilterSplit)) ? stFilterSplit.length : 0;
						var hasStFilterSplit = (stFilterSplitTotal != 0) ? true : false;
						
						if (hasStFilterSplit)
						{
							for (var xx = 0; xx < stFilterSplitTotal; xx++)
							{
								if (!isAlreadyAdded && hasClientFirstName)
								{
									if (clientFirstName.toUpperCase() == stFilterSplit[xx])
									{
										retArrObj.push(arrObjItems[dx]);
										isAlreadyAdded = true;
									}
								}
		
								if (!isAlreadyAdded && hasClientLastName)
								{
									if (clientLastName.toUpperCase() == stFilterSplit[xx])
									{
										retArrObj.push(arrObjItems[dx]);
										isAlreadyAdded = true;
									}
								}
								
							}
						}
						

					}
				}
			}
		}
			catch(ex)
		{
			retArrObj = [];
		}
		return retArrObj
		
	}


	function getArrFilteredSaveForLaterInternalIdMapping(paramArrObjItems)
	{
		var retObj = {};
		var arrObjItems = paramArrObjItems;
		var arrObjItemsTotal = (!isNullOrEmpty(arrObjItems)) ? arrObjItems.length : 0;
		var hasArrObjItems = (arrObjItemsTotal != 0) ? true : false;
		
		try
		{
			if (hasArrObjItems)
			{
				for (var dx = 0; dx < arrObjItemsTotal; dx++)
				{
					var itemInternalId = arrObjItems[dx]['internalid'];
					var isObjKeyItemInternalIdExist = (isObjectExist(retObj['' + itemInternalId + ''])) ? true : false;
					
					if (!isObjKeyItemInternalIdExist)
					{
						retObj['' + itemInternalId + ''] = arrObjItems[dx]
					}
					
					
				}
			}
		
		}
			catch(ex)
		{
			retObj = {};
		}
		return retObj
		
	}


	function getCustomColumnFieldTextValueFromCart(paramArrObjOrder, paramCustomColumnId)
	{
		var functionName = 'getCustomColumnFieldTextValueFromCart';
		var stReturn = '';
		var orderInternalIdRef = '';
		
		try
		{
			var urlParamClientValue = getUrlParameterValue('client');
			var arrUrlParamClient = urlParamClientValue.split('|');
			var arrUrlParamClientTotal = (!isNullOrEmpty(arrUrlParamClient)) ? arrUrlParamClient.length : 0;
			var isArrUrlParamClientTotalEqualToTwo = (arrUrlParamClientTotal == 2) ? true : false;
			orderInternalIdRef = (isArrUrlParamClientTotalEqualToTwo) ? arrUrlParamClient[1] : '';
			var hasOrderInternalIdRef = (!isNullOrEmpty(orderInternalIdRef)) ? true : false;
			
			var arrObjRef = paramArrObjOrder;
			var arrObjRefTotal = (!isNullOrEmpty(arrObjRef)) ? arrObjRef.length : 0;
			var hasArrObjRef = (arrObjRefTotal != 0) ? true : false;
			
			if (hasArrObjRef && hasOrderInternalIdRef)
			{
				for (var dx = 0; dx < arrObjRefTotal; dx++)
				{
					var orderInternalId = arrObjRef[dx]['internalid'];
					
					if (orderInternalId == orderInternalIdRef)
					{
						var objOptionsRef = arrObjRef[dx]['options'];
						var isObjCustomColumnFldExist = (isObjectExist(objOptionsRef['' + paramCustomColumnId + ''])) ? true : false;
						stReturn = (isObjCustomColumnFldExist) ? objOptionsRef['' + paramCustomColumnId + ''] : '';
						break;
					}
				}
			}
		}
			catch(ex)
		{
			stReturn = '';
			console.log('Error in ' + functionName + ': ' + '\n' + ex.toString())

		}
		
		return stReturn;
	}
	
	function getObjDesignOptionsMappingFromCartId(paramArrObjCartLines, paramOrderInternalId)
	{
		var functionName = 'getObjDesignOptionsMappingFromCartId';
		var objReturn = {};
		var arrObjCartLines = paramArrObjCartLines;
		var arrObjCartLinesTotal = (!isNullOrEmpty(arrObjCartLines)) ? arrObjCartLines.length : 0;
		var hasArrObjCartLines = (arrObjCartLinesTotal != 0) ? true : false;

		var orderIdRef = paramOrderInternalId;
		var hasOrderIdRef = (!isNullOrEmpty(orderIdRef)) ? true : false;
		
		//console.log('orderIdRef: ' + orderIdRef + '\n' + 'arrObjCartLines: ' + '\n' + JSON.stringify(arrObjCartLines, 'key', '\t'))
		
		try
		{
			if (hasArrObjCartLines && hasOrderIdRef)
			{
				for (var dx = 0; dx < arrObjCartLinesTotal; dx++)
				{
					var cartInternalId = arrObjCartLines[dx]['internalid']
					
					if (cartInternalId == orderIdRef)
					{
						var objCartOptions = arrObjCartLines[dx]['options'];
						
						for (var xj in objCartOptions)
						{
							console.log('isCustomColumnDesignOptions before')
							var isCustomColumnDesignOptions = (ARR_CUSTOM_COLUMN_DESIGNOPTIONS_IDS.inArray(xj)) ? true : false;
							console.log('isCustomColumnDesignOptions after')
							
							if (isCustomColumnDesignOptions)
							{
								var stDesignOptions = objCartOptions[xj];
								var arrObjDesignOptions = JSON.parse(stDesignOptions) || [];
								var arrObjDesignOptionsTotal = (!isNullOrEmpty(arrObjDesignOptions)) ? arrObjDesignOptions.length : 0;
								var hasArrObjDesignOptions = (arrObjDesignOptionsTotal != 0) ? true : false;
								
								if (hasArrObjDesignOptions)
								{
									for (var dxj = 0; dxj < arrObjDesignOptionsTotal; dxj++)
									{
										var designOptionsNameKey = arrObjDesignOptions[dxj]['name'];
										var designOptionsValueKey = arrObjDesignOptions[dxj]['value'];
										
										var isObjKeyDesignNameExist = (isObjectExist(objReturn['' + designOptionsNameKey + ''])) ? true : false;
										
										if (!isObjKeyDesignNameExist)
										{
											objReturn['' + designOptionsNameKey + ''] = designOptionsValueKey;
										}
									}
								}
							}
						}
					}
				}
			}
		}
			catch(ex)
		{
			objReturn = {};
			console.log('Error in ' + functionName + ': ' + '\n' + ex.toString())
		}
		
		return objReturn;
		
	}
	
	function getFacetCategoryCloneWithoutFacetId(paramArrObj)
	{
		var functionName = 'getFacetCategoryCloneWithoutFacetId';
		var arrObjReturn = [];
		arrObjReturn[0] = {}
		arrObjReturn[0]['config'] = {};
		arrObjReturn[0]['config']['id'] = '';
		arrObjReturn[0]['config']['name'] = '';
		arrObjReturn[0]['config']['behavior'] = 'single';

		arrObjReturn[0]['id'] = 'category';
		arrObjReturn[0]['priority'] = '';
		arrObjReturn[0]['behavior'] = 'single';
		arrObjReturn[0]['value'] = [];
		
		try
		{
			arrObjReturn[0]['config']['id'] = paramArrObj[0]['config']['id'];
			arrObjReturn[0]['config']['name'] = paramArrObj[0]['config']['name'];
			
		}
			catch(ex)
		{
			
		}
		
		return arrObjReturn; 
	}

	function getFacetCategoryCloneForOptionOptions(paramArrObj)
	{
		var functionName = 'getFacetCategoryCloneForOptionOptions';
		var arrObjReturn = [{ config: {  id: 'category'
										, name: 'Category'
										, url: ''
										, priority: ''
										, behavior: 'single'
										, uncollapsible: true
										, titleToken: ''
										, titleSeparator: ''
									  }
							, id: 'category'
							, name: 'Category'
							, priority: 10
							, behavior:'single'
							, url: ''
							, value: ''
							}
					 ]
		
		try
		{

			arrObjReturn = [{ config: {  id: 'category'
										, name: 'Category'
										, url: paramArrObj[0]['config']['url']
										, priority: paramArrObj[0]['config']['priority']
										, behavior: 'single'
										, uncollapsible: true
										, titleToken: paramArrObj[0]['config']['titleToken']
										, titleSeparator: paramArrObj[0]['config']['titleSeparator']
									  }
							, id: 'category'
							, name: 'Category'
							, priority: paramArrObj[0]['config']['priority']
							, behavior:'single'
							, url: paramArrObj[0]['config']['url']
							, value: (isObjectExist(paramArrObj[0]['value'])) ? paramArrObj[0]['value'] : ''
							}
					 ]
			
		}
			catch(ex)
		{
			
		}
		
		return arrObjReturn; 
	}

	function getArrAllSelectedOptions()
	{
		var functionName = 'getAllSelectedOptions';
		var processStr = '';
		
		var arrSelected = [];
		
		try
		{
			var allSelectFldsTotal = jQuery("select").length;
			var hasSelectedFlds = (allSelectFldsTotal != 0) ? true : false;
			
			if (hasSelectedFlds)
			{
				for (var dx = 0; dx < allSelectFldsTotal; dx++)
				{
					var selectedValue = jQuery("select").eq(dx).val();
					var stSelectedValue = (!isNullOrEmpty(selectedValue)) ? selectedValue : '';
					var isSelectedValueInArrSelected = (arrSelected.inArray(stSelectedValue.toString())) ? true : false;
					var isPushArrSelected = (!isSelectedValueInArrSelected) ? arrSelected.push(stSelectedValue.toString()) : '';
				}
			}
		}
			catch(ex)
		{
			arrSelected = [];
		}
		
		return arrSelected;
		
	}


	function getArrErrConflictCodes(paramArrAllSelectedOptions)
	{
		var functionName = 'getArrErrConflictCodes';
		var processStr = '';
		var arrErrMsg = [];
		
		var arrSelected = paramArrAllSelectedOptions;
		var arrSelectedTotal = (!_.isNullOrEmpty(arrSelected)) ? arrSelected.length : 0;
		var hasArrSelected = (arrSelectedTotal != 0) ? true : false;
		
		try
		{
			if (hasArrSelected)
			{
				var isPushArrErrMsg = '';
				var isSelectedOptionConflict = false;
				
				for (var dx = 0; dx < arrSelectedTotal; dx++)
				{
					var stSelectedOption = arrSelected[dx];
					var selectedOption = (!isNullOrEmpty(stSelectedOption)) ? stSelectedOption : '';
					var isSelectedOptionExistInConflictItem = (_.isObjectExist(OBJ_CONFLICT_ITEM['' + selectedOption + ''])) ? true : false;
					
					if (isSelectedOptionExistInConflictItem)
					{
						var arrObjConflict = OBJ_CONFLICT_ITEM['' + selectedOption + '']['CONFLICT'];
						var arrObjConflictTotal = (!_.isNullOrEmpty(arrObjConflict)) ? arrObjConflict.length : 0;
						var hasArrObjConflict = (arrObjConflictTotal != 0) ? true : false;
						
						if (hasArrObjConflict)
						{
							for (var xj = 0; xj < arrObjConflictTotal; xj++)
							{
								/**
								var conflictItem = arrObjConflict[xj]['ITEM'];
								var isSelectedOptionConflict = (arrSelected.inArray(conflictItem)) ? true : false;
								var isPushArrErrMsg = (isSelectedOptionConflict) ? arrErrMsg.push(arrObjConflict[xj]['ERROR']) : '';
								**/
								var stConflictItem = arrObjConflict[xj]['ITEM'];
								var conflictItem = (!isNullOrEmpty(stConflictItem)) ? stConflictItem : '';
								var isConflictItemFabric = (conflictItem == 'fabric') ? true : false;
								var isConflictItemNo = (conflictItem == 'no') ? true : false;
								var isConflicItemNonIds = (isConflictItemFabric || isConflictItemNo) ? true : false;
								
								if (!isConflicItemNonIds)
								{
									isSelectedOptionConflict = (arrSelected.inArray(conflictItem)) ? true : false;
									isPushArrErrMsg = (isSelectedOptionConflict) ? arrErrMsg.push(arrObjConflict[xj]['ERROR']) : ''
								}
								
								if (isConflicItemNonIds)
								{
									/** start fabric conflict error **/
									if (isConflictItemFabric)
									{
										var selectFabricTotal = (!isNullOrEmpty(arrObjConflict[xj]['SELECTFABRIC'])) ? arrObjConflict[xj]['SELECTFABRIC'].length : 0;
										var hasSelectFabric = (selectFabricTotal != 0) ? true : false;
										
										if (hasSelectFabric)
										{
											for (var dxj = 0; dxj < selectFabricTotal; dxj++)
											{
												var selectFabricDropDownId =  arrObjConflict[xj]['SELECTFABRIC'][dxj]['ID']
												var selectFabricDropDownTotal = jQuery("select[name='" + selectFabricDropDownId + "']").length;
												var hasSelectFabricDropDown = (selectFabricDropDownTotal != 0) ? true : false;
												
												if (hasSelectFabricDropDown)
												{
													for (var xx = 0; xx < selectFabricDropDownTotal; xx++)
													{
														var selectFabricValue = jQuery("select[name='" + selectFabricDropDownId + "']").eq(xx).val();
														var selectFabricUpperCaseValue = (!isNullOrEmpty(selectFabricValue)) ? selectFabricValue.toUpperCase() : '';
														var isSelectedValueFabric = (selectFabricUpperCaseValue == 'FABRIC') ? true : false;
														
														if (isSelectedValueFabric)
														{
															arrErrMsg.push(arrObjConflict[xj]['SELECTFABRIC'][dxj]['ERROR']);
														}
													}
												}
											}
										}
									}
									/** end fabric conflict error **/

									/** start no conflict error **/
									if (isConflictItemNo)
									{

										var selectNoTotal = (!isNullOrEmpty(arrObjConflict[xj]['SELECTNO'])) ? arrObjConflict[xj]['SELECTNO'].length : 0;
										var hasSelectNo = (selectNoTotal != 0) ? true : false;
										
										if (hasSelectNo)
										{
											for (var dxj = 0; dxj < selectNoTotal; dxj++)
											{
												var selectNoDropDownId =  arrObjConflict[xj]['SELECTNO'][dxj]['ID']
												var selectNoDropDownTotal = jQuery("select[name='" + selectNoDropDownId + "']").length;
												var hasSelectNoDropDown = (selectNoDropDownTotal != 0) ? true : false;
												
												if (hasSelectNoDropDown)
												{
													for (var xx = 0; xx < selectNoDropDownTotal; xx++)
													{
														var selectNoValue = jQuery("select[name='" + selectNoDropDownId + "']").eq(xx).val();
														var selectNoUpperCaseValue = (!isNullOrEmpty(selectNoValue)) ? selectNoValue.toUpperCase() : '';
														var isSelectedValueNo = (selectNoUpperCaseValue == 'NO') ? true : false;
														
														if (isSelectedValueNo)
														{
															arrErrMsg.push(arrObjConflict[xj]['SELECTNO'][dxj]['ERROR']);
														}
													}
												}
											}
										}
									}
									/** end no conflict error **/

								}
								
							}
						}
					}
				}
			}
			
		}
			catch(ex)
		{
			arrErrMsg = [];
		}
		return arrErrMsg;
	}


	function getHtmlErrConflictCodes(paramArrErr)
	{
		var functionName = 'getHtmlErrConflictCodes';
		var processStr = '';
		var htmlWriter = '';
		var arrErrMsg = paramArrErr;
		var arrErrMsgTotal = (!_.isNullOrEmpty(arrErrMsg)) ? arrErrMsg.length : 0;
		var hasArrErrMsg = (arrErrMsgTotal != 0) ? true : false;
		
		try
		{
			if (hasArrErrMsg)
			{
				for (var dx = 0; dx < arrErrMsgTotal; dx++)
				{
					htmlWriter += '<div style="padding: 5px;">';
					htmlWriter += arrErrMsg[dx]
					htmlWriter += '</div>';

				}
			}
		}
			catch(ex)
		{
			htmlWriter = '';
		}
		return htmlWriter;
	}
	

	function getObjSelectSelectedValues()
	{
		var functionName = 'getObjSelectSelectedValues';
		var processStr = '';
		var objReturn = {};
		
		try
		{
			var allSelectFldsTotal = jQuery("select").length;
			var hasSelectedFlds = (allSelectFldsTotal != 0) ? true : false;
	
			if (hasSelectedFlds)
			{
				for (var dx = 0; dx < allSelectFldsTotal; dx++)
				{
					var selectIdValue = jQuery("select").eq(dx).attr('id');
					var hasSelectId = (!isNullOrEmpty(selectIdValue)) ? true : false;
					
					if (hasSelectId)
					{
						var isSelectedIdExist = (isObjectExist(objReturn['' + selectIdValue + '']));
						
						if (!isSelectedIdExist)
						{
							var selectedValue = jQuery("select").eq(dx).val();
							objReturn['' + selectIdValue + ''] = selectedValue;
						}
					}
				}
			}
		}
			catch(ex)
		{
			objReturn = {};
			console.log('Error in ' + functionName + ': ' + '\n' + ex.toString())
		}
		return objReturn;
	}
	
	
	function getArrConflictCodesError(paramObjConflicCodesMapping, paramArrAllSelectedOptions, paramObjSelectSelectedValues)
	{
		var functionName = 'getArrConflicCodesError';
		var processStr = '';
		var arrErr = []
		
		try
		{
			var OBJ_MAPPING = paramObjConflicCodesMapping;
			var arrAllSelectedOptions = paramArrAllSelectedOptions;
			var arrAllSelectedOptionsTotal = (!isNullOrEmpty(arrAllSelectedOptions)) ? arrAllSelectedOptions.length : 0;
			var objSelectSelectedValues = paramObjSelectSelectedValues;
			
			var hasObjMapping = (!isNullOrEmptyObject(OBJ_MAPPING)) ? true : false;
			var hasArrAllSelectedOptions = (arrAllSelectedOptionsTotal != 0) ? true : false;
			var hasObjSelectSelectedValues = (!isNullOrEmptyObject(objSelectSelectedValues)) ? true : false;
			var isIterateConflictCodes = (hasObjMapping && hasArrAllSelectedOptions && hasObjSelectSelectedValues) ? true : false;
			
			if (isIterateConflictCodes)
			{
				for (var dx = 0; dx < arrAllSelectedOptionsTotal; dx++)
				{
					var optionA = arrAllSelectedOptions[dx];
					var hasOptionA = (!isNullOrEmpty(optionA)) ? true : false;
					
					if (hasOptionA)
					{
						var isOptionAExistInMapping = (isObjectExist(OBJ_MAPPING['' + optionA + ''])) ? true : false;
						
						if (isOptionAExistInMapping)
						{
							var objConflict = OBJ_MAPPING['' + optionA + '']['CONFLICT'];
							
							for (var xj in objSelectSelectedValues)
							{
								var isSelectIdExistInConflict = (isObjectExist(objConflict['' + xj + ''])) ? true : false;
								
								if (isSelectIdExistInConflict)
								{
									var objConflictSelectId = objConflict['' + xj + ''];
									var isSelectSelectedValueExistInConflict = (isObjectExist(objConflictSelectId['' + objSelectSelectedValues[xj] + ''])) ? true : false;
									
									if (isSelectSelectedValueExistInConflict)
									{
										var stErr = objConflictSelectId['' + objSelectSelectedValues[xj] + '']['ERROR'];
										arrErr.push(stErr)
									}
								}
							}
						}
						
					}
				}
			}
		}
			catch(ex)
		{
			arrErr = [];
			console.log('Error in ' + functionName + ': ' + '\n' + ex.toString())
		}
		return arrErr;
	}


	function displayModalWindow(paramModalTitle, paramModalContent, paramIsDisplayModalFooter)
	{
		var functionName = 'displayModalWindow';
		var processStr = '';
		var $ = jQuery;
		var isDisplayModalFooter = (!_.isNullOrEmpty(paramIsDisplayModalFooter)) ? paramIsDisplayModalFooter : true;
		
		try
		{
			$("h3[id='h3-profile-header']").empty();
			$("div[id='div-modal-body']").empty();
			$("class[id='modal-footer']").hide();
			
			$("h3[id='h3-profile-header']").text(paramModalTitle);
			$("div[id='div-modal-body']").html(paramModalContent);
			
			if (isDisplayModalFooter)
			{
				$("class[id='modal-footer']").show()
			}
			
			jQuery("[id='butt-modal']").click()

		}
			catch(ex)
		{

		}
	}
	


// ===========================================================
	SC.Utils.isNullOrEmpty = isNullOrEmpty;
	SC.Utils.isNullOrEmptyObject = isNullOrEmptyObject;
	SC.Utils.isObjectExist = isObjectExist;
	SC.Utils.getArrObjOrderClientList = getArrObjOrderClientList;
	SC.Utils.toggleMobileNavButt = toggleMobileNavButt;
	SC.Utils.suiteRest = suiteRest;
	SC.Utils.getArrObjFilteredSaveForLaterItems = getArrObjFilteredSaveForLaterItems;
	SC.Utils.getArrFilteredSaveForLaterInternalIdMapping = getArrFilteredSaveForLaterInternalIdMapping;
	SC.Utils.getCustomColumnFieldTextValueFromCart = getCustomColumnFieldTextValueFromCart;
	SC.Utils.getDesignOptionsJsonUrl = getDesignOptionsJsonUrl;
	SC.Utils.getUrlParameterValue = getUrlParameterValue;
	SC.Utils.getObjDesignOptionsMappingFromCartId = getObjDesignOptionsMappingFromCartId;
	
	SC.Utils.getFacetCategoryCloneWithoutFacetId = getFacetCategoryCloneWithoutFacetId;
	SC.Utils.getFacetCategoryCloneForOptionOptions = getFacetCategoryCloneForOptionOptions;
	
	SC.Utils.getArrAllSelectedOptions = getArrAllSelectedOptions;
	SC.Utils.getArrErrConflictCodes = getArrErrConflictCodes;
	SC.Utils.getHtmlErrConflictCodes = getHtmlErrConflictCodes;

	SC.Utils.getObjSelectSelectedValues = getObjSelectSelectedValues;
	SC.Utils.getArrConflictCodesError = getArrConflictCodesError;
	
	SC.Utils.displayModalWindow = displayModalWindow;
	
	
	// We extend underscore with our utility methods
	// see http://underscorejs.org/#mixin
	_.mixin(SC.Utils);

	

})();