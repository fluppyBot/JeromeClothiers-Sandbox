/**
 * Client script for Filter popup form.
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Dec 2012     dembuscado
 * 2.00		  07 Feb 2013	  esia			   242354
 * 3.00		  04 Apr 2013	  esia			   247961
 * 4.00		  10 Apr 2013	  esia			   247962
 * 5.00		  10 Apr 2013	  esia			   248260
 * 6.00		  11 Apr 2013	  esia			   248564
 * 7.00		  16 Apr 2013	  esia			   247963
 * 8.00		  18 Apr 2013	  esia			   249114
 * 9.00		  22 Apr 2013	  esia			   248983
 */

/**
 * Popup form UI initializations. 
 * 
 * @param {String} type the mode in which the record is being accessed: create, copy, edit
 * 
 * @returns {Void}
 */
function clientPageInit(type){
//	alert('type: ' + type);
	
	// Hide Value text field for Between qualifier.
	// Hide From-To text fields for Equal, Greater and Less qualifier.
	if (Ext.fly('custpage_value_text_fs')) {
		switch( nlapiGetFieldValue('custpage_qualifier_select') ) {
		case "between":
			// Displays From-To text fields and hides Value text field.
			Ext.fly('custpage_from_text_fs').parent('tr').setStyle('display', '');
			Ext.fly('custpage_value_text_fs').parent('tr').setStyle('display', 'none');
			break;
		default:
			// Displays Value text field and hides From-To text fields.
			Ext.fly('custpage_from_text_fs').parent('tr').setStyle('display', 'none');
			Ext.fly('custpage_value_text_fs').parent('tr').setStyle('display', '');		
		}		
	}	   
}

/**
 * Handles onchange field events for Filter popup form. 
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * 
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum){
//	alert('type: ' + type + '\n' +
//	'name: ' + name + '\n' +
//	'linenum: ' + linenum);
	
	if (name == 'custpage_qualifier_select') {
		switch( nlapiGetFieldValue(name) ) {
		case "between":
			// Displays From-To text fields and hides Value text field.
			Ext.fly('custpage_from_text_fs').parent('tr').setStyle('display', '');
			Ext.fly('custpage_value_text_fs').parent('tr').setStyle('display', 'none');
			break;
		default:
			// Displays Value text field and hides From-To text fields.
			Ext.fly('custpage_from_text_fs').parent('tr').setStyle('display', 'none');
			Ext.fly('custpage_value_text_fs').parent('tr').setStyle('display', '');		
		}
	} else if (name == 'custpage_from_text') {
		nlapiSetFieldValue('custpage_value_text', nlapiGetFieldValue('custpage_from_text'), false);
	} else if (name == 'custpage_value_text') {
		nlapiSetFieldValue('custpage_from_text', nlapiGetFieldValue('custpage_value_text'), false);
	}
}

/**
 * Behavior of Set button in Filter popup form.
 * 
 * @returns {void}
 */
function set() {
	// Format filter value based on filter field type.
	switch( nlapiGetFieldValue('custpage_filterfieldtype_hidden') ) {
	case "checkbox":
		// Check if the prefix Current Selection should be added for the filter value.
		var curselect = nlapiGetFieldValue('custpage_currentselections_select');
		var curselectPrefix = ''; 
		if (curselect == 'T') curselectPrefix = "Current Selection";	
		var startWithDelimiter = (curselectPrefix != '');

		// Format value for Check box field.
		var checkedRadioValue = nlapiGetFieldValue('custpage_checked_radio');
		if (checkedRadioValue == '' || checkedRadioValue == null) {
			if (startWithDelimiter) {
				window.parent.setFilterValue("is " + curselectPrefix);
			}			
		} else {
			window.parent.setFilterValue( "is " + curselectPrefix + formatValues([checkedRadioValue], startWithDelimiter) );
		}	
		
		break;	
	case "currency":
	case "float":
	case "integer":
	case "percent":
		if ( nlapiGetFieldValue('custpage_qualifier_select') == 'between' ) {
			if ( nlapiGetFieldValue('custpage_to_text') != '' ) {
				window.parent.setFilterValue("is " + nlapiGetFieldText('custpage_qualifier_select') + " " 
						+ nlapiGetFieldValue('custpage_from_text') + " and " + nlapiGetFieldValue('custpage_to_text') );				
			} else {
				window.parent.setFilterValue("is equal to " + nlapiGetFieldValue('custpage_from_text'));				
			}
		} else {
			window.parent.setFilterValue("is " + nlapiGetFieldText('custpage_qualifier_select') + " "
					+ nlapiGetFieldValue('custpage_value_text'));
		}
		
		break;
	case "multiselect":
	case "select":
		// Check if the prefix Current Selection should be added for the filter value.
		var curselect = nlapiGetFieldValue('custpage_currentselections_select');
		var curselectPrefix = ''; 
		if (curselect == 'T') curselectPrefix = "Current Selection";	
		var startWithDelimiter = (curselectPrefix != '');
		
		// Format value(s) for Select or Multiselect field.		
		var filterValues = nlapiGetFieldTexts('custpage_filtervalue_multiselect');
		if (filterValues == null) {
			if ( nlapiGetFieldValue('custpage_filtervalue_text') != '') {
				filterValues = [];
				filterValues.push( nlapiGetFieldValue('custpage_filtervalue_text') );				
			} else {
				filterValues = '';
			}
		} 

		if (filterValues == '') {
			if (startWithDelimiter) {
				window.parent.setFilterValue("is any of " + curselectPrefix);
			} else {
				window.parent.setFilterValue("");
			}
		} else {
			window.parent.setFilterValue( "is any of " + curselectPrefix + formatValues(filterValues, startWithDelimiter) );
		}			
	}

	cancel();
}

/**
 * Behavior of Cancel button in Filter popup form.
 * 
 * @returns {void}
 */
function cancel() {
	window.parent.Ext.WindowMgr.getActive().close();
}

/**
 * Format selected values for Filter value display.
 * 
 * @param {String[]} values selected values
 * @param {boolean} startWithDelimiter if true,the value will start with the 'or' delimiter
 * 
 * @returns {String} formatted values for Filter value
 */		
function formatValues(values, startWithDelimiter) {
//	alert('values: ' + values + '\n' +
//	'startWithDelimiter: ' + startWithDelimiter + '\n');
	
	var filterValue = '';
	if (startWithDelimiter) {
		filterValue = ' or ';
	}
	
	for (var i in values) {
		if ( i == (values.length - 1) ) {
			filterValue += values[i];
		} else {
			filterValue += values[i] + ' or ';
		}
	}
	
	return filterValue;
}