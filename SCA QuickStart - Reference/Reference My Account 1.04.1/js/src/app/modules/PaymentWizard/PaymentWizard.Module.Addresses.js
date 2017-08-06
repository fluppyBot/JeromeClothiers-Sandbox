define('PaymentWizard.Module.Addresses', ['OrderWizard.Module.Address.Billing'], function (OrderWizardModuleAddressBilling)
{
	'use strict';

	return OrderWizardModuleAddressBilling.extend({

		itemsPerRow: 3

	,	initialize: function()
		{
			OrderWizardModuleAddressBilling.prototype.initialize.apply(this, arguments);
			this.wizard.model.on('change:payment', jQuery.proxy(this, 'changeTotal'));
		}

	,	render: function()
		{
			if (this.wizard.hidePayment())
			{
				this.$el.empty();
			}
			else
			{
				OrderWizardModuleAddressBilling.prototype.render.apply(this, arguments);
			}
		}

	,	changeTotal: function ()
		{

			var was = this.model.previous('payment')
			,	was_confirmation = this.model.previous('confirmation')
			,	is = this.model.get('payment');

			// Changed from or to 0
			if (((was === 0 && is !== 0) || (was !== 0 && is === 0)) && !was_confirmation)
			{
				this.render();
			}
		}

   ,    getSelectedAddress: function ()
		{
			if (!this.addressId && !this.unset)
			{
				var default_address = this.addresses.findWhere({
					defaultbilling: 'T'
				});
				
				this.addressId = default_address && default_address.id;

				if (this.addressId)
				{
					this.model.set(this.manage, this.addressId);
				}
			}

			return this.addresses.get(this.addressId) || this.getEmptyAddress();
		}

	,   unsetAddress: function ()
		{
			this.unset = true;
			OrderWizardModuleAddressBilling.prototype.unsetAddress.apply(this, arguments);
		}

	,	isValid: function()
		{
			if (this.wizard.hidePayment())
			{
				return jQuery.Deferred().resolve();
			}
			else
			{
				return OrderWizardModuleAddressBilling.prototype.isValid.apply(this, arguments);
			}
		}

	});
});