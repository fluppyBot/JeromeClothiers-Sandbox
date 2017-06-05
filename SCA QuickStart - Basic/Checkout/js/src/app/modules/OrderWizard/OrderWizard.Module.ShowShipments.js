// OrderWizard.Module.ShowShipments.js
// --------------------------------
//
define('OrderWizard.Module.ShowShipments', ['Wizard.Module'], function (WizardModule)
{
	'use strict';

	return WizardModule.extend({

		template: 'order_wizard_showshipments_module'

	,	events: {
			'change #delivery-options': 'changeDeliveryOptions'
		}

	,	render: function ()
		{
			let self = this;

			this.application = this.wizard.application;
			this.profile = this.wizard.options.profile;
			this.options.application = this.wizard.application;
			var userID = this.wizard.options.profile.id;
			console.log('C:\Users\USER\Documents\JeromeClothiers\Sandbox\JeromeClothiers-Sandbox\SCA QuickStart - Basic\Checkout\js\src\app\modules\OrderWizard\OrderWizard.Module.ShowShipments.js>user',userID);
			
			self.clients = [];

			//Initialize Clients Collection
			var param = new Object();
			param.type = "get_client";
			//console.log('services/fitprofile.ss');
			param.data = JSON.stringify({filters: ["custrecord_tc_tailor||anyof|list|" + userID], columns: ["internalid", "custrecord_tc_first_name", "custrecord_tc_last_name", "custrecord_tc_email", "custrecord_tc_addr1", "custrecord_tc_addr2", "custrecord_tc_country", "custrecord_tc_city", "custrecord_tc_state", "custrecord_tc_zip", "custrecord_tc_phone"]});
			jQuery.get(_.getAbsoluteUrl('services/fitprofile.ss'), param).done(function(data){
				//console.log('services/fitprofile.ss',data);
				if(data){
					self.clients = data;
					
					//console.log('services/fitprofile.ss',data);
					//self.clients.add(data);
					//self.trigger("afterInitialize");
				}

				self._render();
			});

			
			// this.trigger('ready', false);
			//this._render();
		}

	,	changeDeliveryOptions: function(e)
		{
			var value = this.$(e.target).val()
			,	self = this;

			this.model.set('shipmethod', value);
			this.step.disableNavButtons();
			this.model.save().always(function()
			{
				self.render();
				self.step.enableNavButtons();
			});
		}
	});
});