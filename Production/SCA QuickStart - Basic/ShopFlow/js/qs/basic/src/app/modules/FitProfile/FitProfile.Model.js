// Fit Profile.Model.js
// -----------------------
// Model for fit profile functionality (CRUD)
define('FitProfile.Model', ['Client.Model', 'Client.Collection', 'Profile.Model', 'Profile.Collection'], function (ClientModel, ClientCollection, ProfileModel, ProfileCollection)
{
	'use strict';

	return Backbone.Model.extend(
	{
		client_collection : new ClientCollection()
	,	profile_collection: null
	,	measurement_config: null
	,	selected_measurement: null

	,	initialize: function(userID){
			var self = this;
			this.set({current_client: null, current_profile: null});
			//Initialize Clients Collection
			var param = new Object();
			param.type = "get_client";
			param.data = JSON.stringify({filters: ["custrecord_tc_tailor||anyof|list|" + userID], columns: ["internalid", "custrecord_tc_first_name", "custrecord_tc_last_name", "custrecord_tc_email", "custrecord_tc_addr1", "custrecord_tc_addr2", "custrecord_tc_country", "custrecord_tc_city", "custrecord_tc_state", "custrecord_tc_zip", "custrecord_tc_phone"]});
			jQuery.get(_.getAbsoluteUrl('services/fitprofile.ss'), param).always(function(data){
				if(data){
					self.client_collection.add(data);
					self.trigger("afterInitialize");
				}
			});


			jQuery.get(_.getAbsoluteUrl('js/FitProfile_Config.json')).done(function(data){
				self.measurement_config = JSON.parse(data);
			});

			this.on("change:current_client", this.fetchProfile);
			this.on("change:current_profile", this.fetchMeasure);
		}
	,	fetchProfile : function(){
			var clientID = this.get("current_client");
			var self = this;
			if(clientID){
				var param = new Object();
				param.type = "get_profile";
				param.data = JSON.stringify({filters: ["custrecord_fp_client||anyof|list|" + clientID], columns: ["internalid", "name", "custrecord_fp_product_type", "custrecord_fp_measure_type", "custrecord_fp_measure_value"]});
				_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "GET", param).always(function(data){
					if(data){
						self.profile_collection = new ProfileCollection().add(JSON.parse(data));
						self.trigger("afterProfileFetch");
					}
				});
			}
		}
	,	removeRec : function(type, id){
			var self = this;
			if(type && id){
				var param = new Object();
				param.type = "remove_" + type;
				param.id = id;

				var currentModel = self[type + "_collection"].find(function(data){
					return data.get("internalid") == id;
				})
				this.set("current_" + type, "");

				_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "GET", param).always(function(data){
					var responseData = JSON.parse(data.responseText)
					if(responseData.status){
						self[type + "_collection"].remove(currentModel);
						self.trigger("afterRemoveRec");
					}
				})
			}
		}
	});
});
