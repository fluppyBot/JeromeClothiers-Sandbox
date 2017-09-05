// FormRenderer.Views.js
// -----------------------
// Views for profile's operations
define('FormRenderer.View',  ['Client.Model', 'Profile.Model'], function (ClientModel, ProfileModel)
{
	'use strict';

	return Backbone.View.extend({
		template: 'form_renderer'
	,	events: {
			'click .save-action' : 'saveForm'
		,	'change select[data-type="country"]': 'updateStates'
		,	'change select[data-type="state"]': 'eraseZip'
		,	'change input[data-type="state"]': 'eraseZip'
		,	'blur input[data-type="phone"]': 'formatPhone'
		}
	,	initialize: function(){
			var mode = this.options.mode.split("|")[0]
			,	type = this.options.mode.split("|")[1];

			if(mode == "new"){
				mode = "Create";
			} else {
				mode = "Update";
			}
			type = type[0].toUpperCase() + type.substring(1, type.length).toLowerCase();

			this.title = mode + " " + type;
		}

	,	render: function(){
			var type = this.options.mode.split("|")[1],
				id = this.options.mode.split("|")[0],
				parent = this.options.mode.split("|")[2],
				html = ""
				Model = "";

			switch(type){
				case "client":
					var Model = null;
					if(id == "new"){
						Model = new ClientModel();
					} else {
						Model = this.options.profileModel.client_collection.find(function(data){
							return data.get("internalid") == id;
						});
					}
					html = SC.macros.clientForm(Model, parent);
					break;
			}

			this.type = type;
			this.id = id;
			this.model = Model;
			this.html = html;

			this._render();
		}
	,	formatPhone: function (e)
		{
			var $target = jQuery(e.target);
			$target.val(_($target.val()).formatPhone());
		}

	,	eraseZip: function (e)
		{
			var elem;
			if (e && e.target)
			{
				// For OPC, there are many data-type=zip so grab the first in the current fieldset
				var zip = jQuery(e.target).closest('fieldset').find('input[data-type="zip"]');
				if (zip.length > 0)
				{
					elem = jQuery(zip[0]);
				}
			}
			if (!elem)
			{
				elem = jQuery('input[data-type="zip"]');
			}
			elem.val('');
		}

		// initialize states dropdown
	,	updateStates: function (e)
		{
			this.$('[data-type="state"]').closest('.control-group').empty().append(
				SC.macros.statesDropdown({
					countries: this.options.application.getConfig('siteSettings.countries')
				,	selectedCountry: this.$(e.target).val()
				,	manage: this.options.manage ? this.options.manage + '-' : ''
				})
			);
			this.eraseZip(e);
		}
	,	saveForm : function(e){
			var formValues = jQuery("#in-modal-" + this.type + "_form").serialize().split("&");
			var self = this;
			var dataToSend = new Array();

			_.each(formValues, function(formValue){
				var field = formValue.split("=")[0],
					value = formValue.split("=")[1],
					formData = new Object();

				if(field == "state"){
					formData.name = "custrecord_tc_state";
				} else if(field == "country"){
					formData.name = "custrecord_tc_country";
				} else {
					formData.name = field;
				}

				formData.value = value.replace("+", " ");
				formData.type = jQuery("[name=" + field + "]").data("rectype");
				formData.sublist = jQuery("[name=" + field + "]").data("sublist");

				if(self.id != "new"){
					if(field != "custrecord_tc_tailor" && field != "custrecord_fp_client" && field != "custrecord_fm_fit_profile" && field != "custrecord_fm_tailor"){
						dataToSend.push(formData);
					}
				} else {
					dataToSend.push(formData);
				}

				if(field != "custrecord_tc_tailor"){
					if(field == "state"){
						self.model.set("custrecord_tc_state", jQuery("[name=" + field + "]").val());
					} else if(field == "country"){
						self.model.set("custrecord_tc_country", jQuery("[name=" + field + "]").val());
					} else {
						self.model.set(field, jQuery("[name=" + field + "]").val());
						if(self.model2){
							self.model2.set(field, jQuery("[name=" + field + "]").val());
						}
					}

				}
			});

			if(!this.model.validate()){
				var param = new Object();
				param.type = this.id == "new"? "create_" + this.type : "update_" + this.type;
				if(this.id != "new"){
					param.id = this.id;
				}
				param.data = JSON.stringify(dataToSend);

				_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "POST", param).always(function(data){
					var newRec = JSON.parse(data.responseText)
					if(data.status){
						if(self.id == "new"){
							if(self.type == "measure"){
								self.options.profileModel.tailor_measure_collection.add(newRec.rec);
							}
							self.options.profileModel[self.type + "_collection"].add(newRec.rec);
						}
						jQuery(".cancel-action").trigger("click");

						self.options.application.getLayout().currentView.showContent();
						self.options.application.getLayout().currentView.displayProfiles(JSON.parse(data.responseText), self.id, true);
					}
				});
			}
			var client_model = SC.Application('MyAccount').getLayout().currentView.model
			var $ = jQuery;
			client_model.set('swx_client_profile_order_history', '');

			jQuery("div[data-type='alert-placeholder']").empty();
			//var clientModel = this.model.get('current_client')
			var clientCollection = client_model.client_collection
			var stClientCollection = JSON.stringify(clientCollection);
			var arrObjClientCollection = (!_.isNullOrEmpty(stClientCollection)) ? JSON.parse(stClientCollection) : [];
			client_model.set('swx_order_client_name', this.$('input[name=custrecord_tc_first_name]').val() + ' ' + this.$('input[name=custrecord_tc_last_name]').val());
			client_model.set('swx_order_client_email', this.$('input[name=custrecord_tc_email]').val());
			client_model.set('swx_order_client_phone', this.$('input[name=custrecord_tc_phone]').val());
			client_model.set('swx_is_display_client_details', '');

			var objFilters = {};
			objFilters['name'] = client_model.get('swx_order_client_name');
			objFilters['email'] = client_model.get('swx_order_client_email');
			objFilters['phone'] = client_model.get('swx_order_client_phone');

			var arrObjClient = _.getArrObjOrderClientList(arrObjClientCollection, objFilters)

			//console.log('objFilters: ' + '\n' + JSON.stringify(objFilters, 'key', '\t'))
			//console.log('arrObjClient: ' + '\n' + JSON.stringify(arrObjClient, 'key', '\t'))
			//console.log('swxOrderClientSearch: ' + '\n' + JSON.stringify(clientCollection, 'key', '\t'))

			$("[id='order-history']").empty();
			var arrObjClientList = [];
			$("#swx-order-client-list").empty();
			$("#swx-order-client-list").html(SC.macros.swxOrderClientList(arrObjClient));

			_.toggleMobileNavButt();
		}
	});
});
