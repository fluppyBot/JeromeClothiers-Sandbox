/**
 * Client script for Dynamic Merchandising Rule form.
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Nov 2012     esia
 * 2.00		  11 Jan 2013	  esia			   239768
 * 3.00		  16 Jan 2013	  esia			   240384
 * 4.00		  22 Jan 2013	  esia			   239924
 * 5.00		  28 Jan 2013	  esia			   239765
 * 6.00		  28 Jan 2013	  esia			   241500
 * 7.00		  29 Jan 2013	  esia			   241613
 * 8.00		  05 Feb 2013	  esia			   241500
 * 9.00		  06 Feb 2013	  esia			   242336
 * 10.00	  07 Feb 2013	  esia			   242354
 * 11.00	  07 Feb 2013	  esia			   242342
 * 12.00	  08 Feb 2013	  esia			   242340
 * 13.00	  04 Apr 2013	  esia			   247961
 * 14.00	  08 Apr 2013	  esia			   247603
 * 15.00	  10 Apr 2013	  esia			   247962
 * 16.00	  11 Apr 2013	  esia			   248564
 * 17.00	  17 Apr 2013	  esia			   246651
 * 18.00	  18 Apr 2013	  esia			   249114
 * 19.00	  18 Apr 2013	  esia			   249128
 * 20.00	  24 Apr 2013	  esia			   249609
 * 21.00	  24 Apr 2013	  esia			   249726
 * 22.00	  25 Apr 2013	  esia			   249726
 * 23.00	  14 Jun 2013	  esia			   252951
 */

var psg_dm;
if (!psg_dm) { psg_dm = {}; }

psg_dm.doDeleteSublist = false;

/**
 * Form validations and UI modifications before loading of page.
 * 
 * @param {String} type the mode in which the record is being accessed: create, copy, edit
 * 
 * @returns {Void}
 */
function clientPageInit(type) {
	
	if (type == 'create' || type == 'edit') {
		// Hide New and Open Fieldset icons.
		if (psg_dm.isNewUI()) { // for 14.2 UI Reskin
			Ext.fly('custrecord_fieldset_popup_new').parent().setStyle('display', 'none');
		}
		else {
			Ext.fly('custrecord_fieldset_popup_new').setStyle('display', 'none');
			Ext.fly('custrecord_fieldset_popup_link').setStyle('display', 'none');
		}	

		// Hide New select option of FieldSet select.
		Ext.fly('inpt_custrecord_fieldset2').on('focus', function(e,t) {
			removeNewSelectOptionValue();
		});
		Ext.fly('inpt_custrecord_fieldset2').on('click', function(e,t) {
			removeNewSelectOptionValue();
		});		
		
		// Change the behavior of Open Filter icon to edit the value of selected filter.
		Ext.getDom('custrecord_filter_popup_link').onclick = null;
		Ext.fly('custrecord_filter_popup_link').on('click', function(e,t) {
			if ( nlapiGetCurrentLineItemText('recmachcustrecord_merch_rule_name_filter','custrecord_filter') != '' ) {
				openFilterPopupForm( nlapiGetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_filter_value') );
			} else {
				alert('You must first select a field');
			}
		});
		
		// Check if Filter field is a pop-up select or a select field.
		if (Ext.fly('custrecord_filter_popup_muli')) {			
			// Change Open Filter icon label of Filter pop-up select to Edit instead of Open.
			var filterPopupLink = Ext.get('custrecord_filter_popup_link');
			var filterPopupLinkDom = Ext.getDom(filterPopupLink);
			var filterPopupLinkLabel = filterPopupLinkDom.innerHTML;
			filterPopupLinkDom.innerHTML = filterPopupLinkLabel.substring(0, (filterPopupLinkLabel.indexOf('&nbsp;') + 6) ) + 'Edit';
			filterPopupLinkDom.title = 'Edit';
			
			// Hide Edit Filter icon of Filter pop-up select.
			filterPopupLink.next('font').setStyle('display', 'none');
			filterPopupLink.next('a').setStyle('display', 'none');
			
			// Hide Open and Edit Sort icon of Sort pop-up select.
			Ext.fly('custrecord_sort_popup_link').parent('div').setStyle('display', 'none');
			
			// Hide New icon of Filter pop-up select.
			Ext.fly('custrecord_filter_popup_new').parent('div').setStyle('display', 'none');
			
			// Hide New icon of Sort pop-up select.
			Ext.fly('custrecord_sort_popup_new').parent('div').setStyle('display', 'none');
			
			// Hide New select option of Sort Option select.
			Ext.fly('inpt_custrecord_sort_option3').on('focus', function(e,t) {
				removeNewSelectOptionValue();
			});
			Ext.fly('inpt_custrecord_sort_option3').on('click', function(e,t) {
				removeNewSelectOptionValue();
			});			
		} else {
			// Hide Open Sort icon.
			Ext.fly('custrecord_sort_popup_link').setStyle('display', 'none');		

			// Hide New select option of Filter select.
			Ext.fly('inpt_custrecord_filter3').on('focus', function(e,t) {
				removeNewSelectOptionValue();
			});
			Ext.fly('inpt_custrecord_filter3').on('click', function(e,t) {
				removeNewSelectOptionValue();
			});
			
			// Hide New select option of Sort select.
			Ext.fly('inpt_custrecord_sort4').on('focus', function(e,t) {
				removeNewSelectOptionValue();
			});
			Ext.fly('inpt_custrecord_sort4').on('click', function(e,t) {
				removeNewSelectOptionValue();
			});				
			
			// Hide New select option of Sort Option select.
			Ext.fly('inpt_custrecord_sort_option5').on('focus', function(e,t) {
				removeNewSelectOptionValue();
			});
			Ext.fly('inpt_custrecord_sort_option5').on('click', function(e,t) {
				removeNewSelectOptionValue();
			});			
		}
	}
	
	if (type == 'edit') {		
		// Hide New Merchandising Rule Filter and New Merchandising Rule Sort buttons from Filter and Sort sub tabs.
		Ext.select('input[value="New Merchandising Rule Filter"]').elements[0].parentNode.parentNode.style.display = 'none';
		Ext.select('input[value="New Merchandising Rule Sort"]').elements[0].parentNode.parentNode.style.display = 'none';
		
		// Check if value of Fieldset select is still active.
		var site = nlapiGetFieldText('custrecord_site');
		var fieldset = nlapiGetFieldValue('custrecord_fieldset');
		if (fieldset != '') {
			var isActive = nlapiLookupField('customrecord_merch_website_fieldsets', fieldset, 'custrecord_active_fieldsets');
//			alert(fieldset + ' ' + isActive);
			if (isActive == 'F') {
				alert(nlapiGetFieldText('custrecord_fieldset') + ' of ' + site + ' site is no longer available.\n' + 
						'Please select another fieldset for this merchandising rule.');

				// Sets value of Site to Site Name hidden field to populate Fieldset select options.
				nlapiSetFieldValue('custrecord_site_name_rule', site, false, true);
			} else {
				// Sets value of Site to Site Name hidden field to populate Fieldset select options.			
				nlapiSetFieldValue('custrecord_site_name_rule', site, false, true);
				// Sets previous value of Fieldset select.
				nlapiSetFieldValue('custrecord_fieldset', fieldset, false, true);
			}
			
			// Sets value of Site to Site Name hidden fields in Filter and Sort sublist line items to populate Filter and Sort select options.
			nlapiSetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_site_name_filter', nlapiGetFieldText('custrecord_site'), false, true);
			nlapiSetCurrentLineItemValue('recmachcustrecord_merch_rule_name_sort', 'custrecord_site_name_sort', nlapiGetFieldText('custrecord_site'), false, true);		
		}
	}
}

/**
 * Open Filter Popup form for creating and editing of filters.
 * 
 * @param {String} value filter value
 * 
 * @returns {Void}
 */
function openFilterPopupForm(value) {
//	alert('value: ' + value + '\n');
	
	if (typeof value == 'undefined') {
		value = '';
	}
	
	// Open Setting Up Filter Description popup.
	var url = window.location.href; 
	var linkprefix = url.substring(0, url.indexOf('/app'));
	
	var filterUrl = linkprefix + nlapiResolveURL('SUITELET', 'customscript_dm_ss_filterpopup', 'customdeploy_dm_ss_filterpopup')
    		+ "&filterName=" + nlapiGetCurrentLineItemText('recmachcustrecord_merch_rule_name_filter', 'custrecord_filter') 
    		+ "&filterInternalId=" + nlapiLookupField('customrecord_merch_website_filters', nlapiGetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_filter'), 'custrecord_filter_internal_id')
    		+ "&filterFieldType=" + nlapiLookupField('customrecord_merch_website_filters', nlapiGetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_filter'), 'custrecord_filter_field_type') 
    		+ "&applyCurrentSelections=" + nlapiGetFieldValue('custrecord_apply_current_selections')
    		+ "&value=" + value;
	
    var winname = 'select_filter';
	var width = 550;
	var height = 250;
	var fld = null;
	var scrollbars = true;
	var winTitle = 'Setting Up Filter Descriptions';
	var listeners = null;   
	
	// for 14.2 UI Reskin	
	if (psg_dm.isNewUI()) {
		height = 350;
	}
	
	nlExtOpenWindow(filterUrl, winname, width, height, fld, scrollbars, winTitle, listeners);	
}

/**
 *  Removes New select option value for custom select fields.
 *  
 *  @returns {Void}
 */
function removeNewSelectOptionValue() {
    var elements = document.getElementsByTagName('div');
    var newSelectOption, selectHeight;
    for (var i in elements) {
        if (elements[i].innerHTML == '- New -') {
        	newSelectOption = Ext.get(elements[i]);        	
        	selectHeight = newSelectOption.parent().getStyle('height');
        	selectHeight = selectHeight.substring(0, selectHeight.indexOf('px'));
//        	alert(selectHeight);
        	newSelectOption.parent().setStyle('height', selectHeight - 20 + 'px');
        	newSelectOption.remove();        	
        }
    }	
}

/**
 * Handles onchange field events. 
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

	if (type == 'recmachcustrecord_merch_rule_name_filter' && name == 'custrecord_filter') {
		if ( nlapiGetCurrentLineItemText('recmachcustrecord_merch_rule_name_filter','custrecord_filter') != "" ) {			
			// Open Filter Popup form.
			openFilterPopupForm();
		}

	}
}

/**
 * Handles onblur field events. 
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * 
 * @returns {boolean} return false to prevent the field's value from changing
 */
function clientValidateField(type, name, linenum) {
//	alert('type: ' + type + '\n' +
//			'name: ' + name + '\n' +
//			'linenum: ' + linenum);
	
	var continueChange = true;
	
	if (name == 'custrecord_site') {
		var continueRemove = true;
		
		// Check if Filter or Sort sublists is not empty.
		if ( nlapiGetLineItemCount('recmachcustrecord_merch_rule_name_filter') > 0 ||
				nlapiGetLineItemCount('recmachcustrecord_merch_rule_name_sort') > 0 ) {
			var	showWarningMsg = 'Changing the value of Site will remove all items in the Filter and Sort sub tabs. Do you wish to continue?';
			
			if ( !confirm(showWarningMsg) ) {
				continueRemove = false;
				continueChange = false;
			}
		} else {
			continueRemove = false;
		}

		if (continueRemove) {
			// Delete all sublist line items of Filter and Sort sublist.
			removeSublistLineItems('recmachcustrecord_merch_rule_name_filter');
			removeSublistLineItems('recmachcustrecord_merch_rule_name_sort');				
		}	

		if (continueChange) {
			// Sets value of Site to Site Name hidden field to populate Fieldset select options.
			nlapiSetFieldValue('custrecord_site_name_rule', nlapiGetFieldText('custrecord_site'), false, true);		

			// Sets value of Site to Site Name hidden fields in Filter and Sort sublist line items to populate Filter and Sort select options.
			nlapiSetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_site_name_filter', nlapiGetFieldText('custrecord_site'), false, true);
			nlapiSetCurrentLineItemValue('recmachcustrecord_merch_rule_name_sort', 'custrecord_site_name_sort', nlapiGetFieldText('custrecord_site'), false, true);
		}		
	}
	
	return continueChange;
}

/**
 * Remove all line items of the given sublist.
 * 
 * @param {String} type sublist internal Id
 */
function removeSublistLineItems(type) {
//	alert('type: ' + type);
	
	psg_dm.doDeleteSublist = true;
	
	var lineCount = nlapiGetLineItemCount(type);
//	alert(lineCount);	
	while (lineCount > 0) {
		nlapiRemoveLineItem(type, 1);
		lineCount--;
	}
	
	psg_dm.doDeleteSublist = false;
}

/**
 * Check required fields before saving record.
 * 
 * @returns {boolean} returns false to suppress submission of form
 */
function clientSaveRecord() {
	var continueSave = true;
	var errorMsg = 'Please enter value(s) for:\n';

	// Check if Merchandising ID field contains whitespaces.
	var isValidMerchId = /\s/;
	if ( nlapiGetFieldValue('name') != '' ) {
		if ( isValidMerchId.test(nlapiGetFieldValue('name')) ) {
			errorMsg += '\t- Merchandising ID: Merchandising ID should not contain any spaces.\n';
			continueSave = false;
		}
	}
	
	var fieldInternalId = '';
	var customRecFields = [];
	var inactiveFieldsArray = [];	
	// Check if fields of Filter sublists are still active.
	var lineCount = nlapiGetLineItemCount('recmachcustrecord_merch_rule_name_filter');
	if (lineCount > 0) {
//		alert('lineCount: ' + lineCount);
		for (var i = 1; i <= lineCount; i++) {
			fieldInternalId = nlapiGetLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_filter', i);
			customRecFields = nlapiLookupField('customrecord_merch_website_filters', fieldInternalId, ['custrecord_active_filters', 'name']);
//			alert(fieldInternalId + ' ' + customRecFields.custrecord_active_filters);
			if (customRecFields.custrecord_active_filters == 'F') {
				//Add filter name to inactive filter array.
				inactiveFieldsArray.push(customRecFields.name);
			}
		}
		
		if (inactiveFieldsArray.length > 0) {
			errorMsg += '\t- Filter: ';
			if (inactiveFieldsArray.length > 1) {
				for (var i in inactiveFieldsArray) {
					errorMsg += ((i > 0) ? ', ' : '') + inactiveFieldsArray[i];
				}				
				errorMsg += ' fields are no longer available.\n';
			} else {
				errorMsg += inactiveFieldsArray[0] + ' field is no longer available.\n';
			}

			continueSave = false;
		}
	}
	
	// Check if fields of Sort sublists are still active.
	inactiveFieldsArray = [];
	lineCount = nlapiGetLineItemCount('recmachcustrecord_merch_rule_name_sort');
	if (lineCount > 0 ) {
//		alert('lineCount: ' + lineCount);
		for (var i = 1; i <= lineCount; i++) {
			fieldInternalId = nlapiGetLineItemValue('recmachcustrecord_merch_rule_name_sort', 'custrecord_sort', i);
			customRecFields = nlapiLookupField('customrecord_merch_website_sorts', fieldInternalId, ['custrecord_active_sorts', 'name']);
//			alert(fieldInternalId + ' ' + customRecFields.custrecord_active_filters);
			if (customRecFields.custrecord_active_sorts == 'F') {
				//Add filter name to inactive filter array.
				inactiveFieldsArray.push(customRecFields.name);
			}
		}
		
		if (inactiveFieldsArray.length > 0) {
			errorMsg += '\t- Sort: ';
			if (inactiveFieldsArray.length > 1) {
				for (var i in inactiveFieldsArray) {
					errorMsg += ((i > 0) ? ', ' : '') + inactiveFieldsArray[i];
				}				
				errorMsg += ' fields are no longer available.\n';
			} else {
				errorMsg += inactiveFieldsArray[0] + ' field is no longer available.\n';
			}

			continueSave = false;
		}		
	}
	
	if (!continueSave) {
		alert(errorMsg);
	} else {
		var merchId = nlapiGetFieldValue('name');		
		var site = nlapiGetFieldValue('custrecord_site');
		if (merchId != '' && site != '') {
			var doCompare = false;
			var id = nlapiGetFieldValue('id');
			if ( typeof id == 'undefined' || id === null || id === '' ) {
				doCompare = true;
			} else {
				var prevMerchId = nlapiLookupField('customrecord_merch_rule', id, 'name');
				var prevSite = nlapiLookupField('customrecord_merch_rule', id, 'custrecord_site');
				if ( merchId != prevMerchId || site != prevSite ) {
					doCompare = true;
				}
			}
			
			if (doCompare) {
				// Check if Merchandising Rule record is unique.
				var filters = [ new nlobjSearchFilter('name', null, 'is', merchId),
				                new nlobjSearchFilter('custrecord_site', null, 'is', site) ];
				var result = nlapiSearchRecord('customrecord_merch_rule', null, filters, null);		
				if (result) {
					alert('This Merchandising ID already exists. Please change the Merchandising ID.');
					continueSave = false;
				}										
			}
		}
	}
	
	return continueSave;
}

/**
 * Sets the Site hidden field in the sublist line item to populate either the Filter or Sort select options.
 *  
 * @param {String} type sublist internal Id
 */
function sublistLineInit(type) {
//	alert('type: ' + type + '\n' +
//			'doDeleteSublist: ' + psg_dm.doDeleteSublist + '\n');
	
	if (!psg_dm.doDeleteSublist) {
		if (type == 'recmachcustrecord_merch_rule_name_filter') {

			var currVal = nlapiGetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_filter');
			if(currVal == ''){
				nlapiSetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_site_name_filter', nlapiGetFieldText('custrecord_site'), false, true);	
			}
			
		} else if (type == 'recmachcustrecord_merch_rule_name_sort') {
			
			var currVal = nlapiGetCurrentLineItemValue('recmachcustrecord_merch_rule_name_sort', 'custrecord_sort');
			if(currVal == ''){
				nlapiSetCurrentLineItemValue('recmachcustrecord_merch_rule_name_sort', 'custrecord_site_name_sort', nlapiGetFieldText('custrecord_site'), false, true);	
			}			
		}		
	}
}

/**
 * Validates if values added in sublists are unique and check if there are values for Value and Sort Option fields.
 * 
 * @param {String} type sublist internal Id
 * 
 * @returns {boolean} returns false to suppress addition of line to sublist 
 */
function sublistValidateLine(type) {
//	alert('type: ' + type);
	
	var fieldId = '';	
	var fieldValueId = '';
	if (type == 'recmachcustrecord_merch_rule_name_filter') {
		fieldId = 'custrecord_field_id_filter';
		fieldValueId = 'custrecord_filter_value';
	} else if (type == 'recmachcustrecord_merch_rule_name_sort') {
		fieldId = 'custrecord_field_id_sort';
		fieldValueId = 'custrecord_sort_option';
	}
	
	var continueAdd = true;
	var fieldValue = nlapiGetCurrentLineItemValue(type, fieldId);
//	alert('fieldId: ' + fieldId + '\n' +
//			'fieldValue: ' + fieldValue + '\n');
	if (fieldValue != '') {
		// Checks if value added is unique.
		var lineCount = nlapiGetCurrentLineItemIndex(type) - 1;	
//		alert('lineCount: ' + lineCount);
		while (lineCount > 0 && continueAdd) {
			if ( fieldValue == (nlapiGetLineItemValue(type, fieldId, lineCount)) ) {
				continueAdd = false;
				alert('The selected value for the sublist already exists. Please select another value.');
			}
			
			lineCount--;
		}		
		
		if (continueAdd) {
			// Check if value is entered for Value or Sort Option fields.
			fieldValue = nlapiGetCurrentLineItemValue(type, fieldValueId);
			if (fieldValue == '') {
				continueAdd = false;
				if (type == 'recmachcustrecord_merch_rule_name_filter') {
					alert('Please enter a value for Value.');
				} else if (type == 'recmachcustrecord_merch_rule_name_sort') {
					alert('Please select a value for Sort Option.');
				}				
			}
		}
	} else {
		continueAdd = false;
	}
	
	return continueAdd;
}

/**
 * Set the filter value from Filter popup form.
 * 
 * @returns {void}
 */
function setFilterValue(filterValue){
	nlapiSetCurrentLineItemValue('recmachcustrecord_merch_rule_name_filter', 'custrecord_filter_value', filterValue);
}
