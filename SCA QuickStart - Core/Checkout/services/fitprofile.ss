/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Mar 2015     rvindal
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
 var	session = container.getShoppingSession();
function service(request, response){
	try{
		
		var type = request.getParameter('type');
		var responseData = "sample";
		
		switch(type){
			case "get_client":
				var data = request.getParameter('data');
				
				if(data){
					data = JSON.parse(data);
					nlapiLogExecution("Debug", "Test1", JSON.stringify(recordFunctions.processColumnData(data.columns)));
					responseData = recordFunctions.fetchRecord("customrecord_sc_tailor_client", recordFunctions.processFilterData(data.filters), recordFunctions.processColumnData(data.columns));
				}
				break;
			case "create_client":
				var data = request.getParameter('data');
				if(data){
					data = JSON.parse(data);
					responseData = recordFunctions.createRecord("customrecord_sc_tailor_client", data);
				}
				break;
			case "update_client":
				var data = request.getParameter('data');
				var id = request.getParameter('id');
				if(data){
					data = JSON.parse(data);
					responseData = recordFunctions.updateRecord("customrecord_sc_tailor_client", id, data);
				}
				break;
			case "remove_client":
				var id = request.getParameter('id');
				if(id){
					responseData = recordFunctions.deleteRecord("customrecord_sc_tailor_client", id);
				}
			case "get_profile":
				var data = request.getParameter('data');
				if(data){
					data = JSON.parse(data);
					responseData = recordFunctions.fetchRecord("customrecord_sc_fit_profile", recordFunctions.processFilterData(data.filters), recordFunctions.processColumnData(data.columns));
				}
				break;
			case "create_profile":
				var data = request.getParameter('data');
				if(data){
					data = JSON.parse(data);
					responseData = recordFunctions.createRecord("customrecord_sc_fit_profile", data);
				}
				break;
			case "update_profile":
				var data = request.getParameter('data');
				var id = request.getParameter('id');
				if(data){
					data = JSON.parse(data);
					responseData = recordFunctions.updateRecord("customrecord_sc_fit_profile", id, data);
				}
				break;
			case "remove_profile":
				var id = request.getParameter('id');
				if(id){
					responseData = recordFunctions.deleteRecord("customrecord_sc_fit_profile", id);
				}				
				break;				
		}

		Application.sendContent(responseData);
		
	} catch(ex) {
		var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Debug', 'Error encountered', 'Error: ' + errorStr);
        var errData = new Object();
        errData.status = false;
        if(errorStr.indexOf("THIS_RECORD_CANNOT_BE_DELETED_BECAUSE_IT_HAS_DEPENDENT_RECORDS") > -1){
        	 errData.message = "This record cannot be deleted because it has dependent records.";
        } else {
        	 errData.message = errorStr;
        }
       
        response.setContentType("JAVASCRIPT");
		response.write(JSON.stringify(errData));
	}
}


var recordFunctions = {
	/** Basic CRUD Record Functions */
	fetchRecord: function(type, filters, columns){
		if(type){
			var arrFilter = [], 
				arrColumn = [],
				results = [];
			
			arrFilter.push(new nlobjSearchFilter('isinactive', '', 'is', 'F'));
			if(filters.length > 0){
				for(var i=0; i < filters.length; i++){
					var filter = filters[i];
					
					if(filter.type == "list"){
						arrFilter.push(new nlobjSearchFilter(filter.field, filter.join, filter.operand, filter.value.split(",")));
					} else {
						arrFilter.push(new nlobjSearchFilter(filter.field, filter.join, filter.operand, filter.value));
					}
				}
			}
			
			if(columns.length > 0){
				for(var k=0; k < columns.length; k++){
					var column = columns[k];
					
					if(column.join != ""){
						arrColumn.push(new nlobjSearchColumn(column.field, column.join));
					} else {
						arrColumn.push(new nlobjSearchColumn(column.field));
					}
				}
			}
			
			var searchResults = nlapiSearchRecord(type, null, arrFilter, arrColumn);
			if(searchResults != null){
				for(var j=0; j < searchResults.length; j++){
					var searchResult = searchResults[j];
					var result = new Object();
					
					if(columns.length > 0){
						for(var l=0; l < columns.length; l++){
							var column = columns[l];
							
							if(column.join){
								result[column.field] = searchResult.getValue(column.field, column.join);
							} else {
								if(column.field == "custrecord_fp_product_type" || column.field == "custrecord_fp_measure_type"){
									result[column.field] = searchResult.getText(column.field);
								} else {
									result[column.field] = searchResult.getValue(column.field);
								}
							}
						}
					}
					
					if(result){
						results.push(result);
					}
				}
			}
			
			return results;
		}
	},
	
	updateRecord: function(type, id, data){
		if(type && id && data){
			var rec = nlapiLoadRecord(type, id);
			var selectedLineitem = false;
			var sublist_group = "";
			var recObj = new Object();
			
			for(var i = 0; i < data.length; i++){
				var field_name = data[i].name,
					field_value = data[i].value,
					field_type = data[i].type;
				
				if(field_type == "sublist"){
					var field_sublist = data[i].field_sublist;
					if(!selectedLineitem){
						rec.selectLineItem(field_sublist, 1);
						rec.setCurrentLineItemValue(field_sublist, field_name, unescape(field_value));
						selectedLineitem = true;
						sublist_group = field_sublist;
					} else {
						rec.setCurrentLineItemValue(field_sublist, field_name, unescape(field_value));
					}
					rec.setLineItemValue(field_sublist, field_name, 1, unescape(field_value));
				} else {
					if(unescape(field_value) && unescape(field_value) != "undefined"){
						var value = unescape(field_value.replace(/%2B/g, " "));
						rec.setFieldValue(field_name, value == "undefined" ? "" : value);
						recObj[field_name] = value == "undefined" ? "" : value;
					} else {
						rec.setFieldText(field_name, unescape(data[i].text));
						recObj[field_name] = unescape(data[i].text);
					}
				}
			}
			rec.commitLineItem(sublist_group);
			
			var recID = nlapiSubmitRecord(rec, true, true);
			if(recID){
				var recDetails = new Object();
				recDetails.id = recID;
				recObj["internalid"] = recID;
				recDetails.rec = recObj;
				recDetails.message = "Record was updated";
				recDetails.status = true;
			} else {
				recDetails.message = "Record was not updated";
				recDetails.status = true;
			}
			return recDetails;
		}
	},
	
	createRecord: function(type, data){
		if(type){
			var newRec = nlapiCreateRecord(type);
			var selectedLineitem = false;
			var sublist_group = "";
			var rec = new Object();
			
			if(data.length > 0){
				for(var i=0; i < data.length; i++ ){
					var field_name = data[i].name,
						field_value = data[i].value,
						field_type = data[i].type;
						
					if(field_type == "sublist"){
						var field_sublist = data[i].sublist;
						if(!selectedLineitem){
							newRec.selectNewLineItem(field_sublist);
							newRec.setCurrentLineItemValue(field_sublist, field_name, unescape(field_value));
							selectedLineitem = true;
							sublist_group = field_sublist;
						} else {
							newRec.setCurrentLineItemValue(field_sublist, field_name, unescape(field_value));
						}

						
					} else {
						if(unescape(field_value) && unescape(field_value) != "undefined"){
							var value = unescape(field_value.replace(/%2B/g, " "));
							newRec.setFieldValue(field_name, value == "undefined" ? "" : value);
							rec[field_name] = value == "undefined" ? "" : value;
						} else {
							newRec.setFieldText(field_name, unescape(data[i].text));
							rec[field_name] = unescape(data[i].text);
						}

					}
				}
				newRec.commitLineItem(sublist_group);
				
				var recID = nlapiSubmitRecord(newRec, true, true);
				var recDetails = new Object();
				if(recID){
					recDetails.id = recID;
					rec["internalid"] = recID;
					recDetails.rec = rec;
					recDetails.message = "Record was created";
					recDetails.status = true;
				} else {
					recDetails.message = "Record was not created";
					recDetails.status = false;
				}
				return recDetails;
			}
		}
	},
	
	deleteRecord: function(type, id){
		if(type && id){
			var recID = nlapiDeleteRecord(type, id);
			var recDetails = new Object();
			if(recID){
				recDetails.id = recID;
				recDetails.message = "Record was deleted";
				recDetails.status = true;
			} else {
				recDetails.message = "Record was not deleted";
				recDetails.status = false;
			}
			return recDetails;
		}
	},
	
	submitMultiField: function(type, id, field, value){
		if(type && id && field && value){
			var currentRec = nlapiLoadRecord(type, id);
			var currentValue = currentRec.getFieldValue(field);
			if(typeof(currentValue) == "string"){
				var newValue = [];
				newValue.push(currentValue);
				newValue.push(value);
				currentValue = newValue;
			} else {
				if(currentValue){
					currentValue.push(value);
				}
			}
			
			currentRec.setFieldValues(field, currentValue);
			var recID = nlapiSubmitRecord(currentRec, true, true);
			
			var recDetails = new Object();
			
			if(recID){
				recDetails.id = recID;
				recDetails.message = "Field was updated";
				recDetails.status = true;
			} else {
				recDetails.message = "Field was not updated";
				recDetails.status = false;
			}
			return recDetails;
		}
	},
	
	/** Utilities */
	processFilterData: function(filterData){
		if(filterData && filterData.length > 0){
			var filters = new Array();
			for(var i = 0; i < filterData.length; i++){
				var filter = new Object();
				var filterDataArr = filterData[i].split("|");
				
				filter.field = filterDataArr[0];
				filter.join = filterDataArr[1];
				filter.operand = filterDataArr[2];
				filter.type = filterDataArr[3];
				filter.value = filterDataArr[4];
				
				filters.push(filter);
			}
			return filters;
		}
	},
	
	processColumnData: function(columnData){
		if(columnData && columnData.length > 0){
			var columns = new Array();
			for(var i = 0; i < columnData.length; i++){
				var column = new Object();
				var columnDataArr = columnData[i].split("|");
				
				column.field = columnDataArr[0];
				column.join = columnDataArr[1];
				
				columns.push(column);
			}
			return columns;
		}
	}
};