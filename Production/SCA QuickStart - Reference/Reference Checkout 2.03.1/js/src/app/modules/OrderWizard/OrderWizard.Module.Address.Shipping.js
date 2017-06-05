// OrderWizard.Module.Address.Shipping.js
// --------------------------------------
//
define('OrderWizard.Module.Address.Shipping', ['OrderWizard.Module.Address'],  function (OrderWizardModuleAddress)
{
	'use strict';

	return OrderWizardModuleAddress.extend({

		manage: 'shipaddress'
	,	sameAsManage: 'billaddress'

	,	errors: ['ERR_CHK_INCOMPLETE_ADDRESS', 'ERR_CHK_SELECT_SHIPPING_ADDRESS', 'ERR_CHK_INVALID_SHIPPING_ADDRESS', 'ERR_WS_INVALID_SHIPPING_ADDRESS']
	,	sameAsMessage: _('Same as billing address').translate()

	,	selectAddressErrorMessage: {
			errorCode: 'ERR_CHK_SELECT_SHIPPING_ADDRESS'
		,	errorMessage: _('Please select a shipping address').translate()
		}

	,	invalidAddressErrorMessage: {
			errorCode: 'ERR_CHK_INVALID_SHIPPING_ADDRESS'
		,	errorMessage: _('The selected shipping address is invalid').translate()
		}

	,	selectMessage: _('Ship to this address').translate()

	,	isActive: function()
		{
			return !this.wizard.model.get('ismultishipto');
		}

	,	eventHandlersOn: function ()
		{
			OrderWizardModuleAddress.prototype.eventHandlersOn.apply(this, arguments);

			this.model.on('change:tempshipaddress', jQuery.proxy(this, 'estimateShipping'), this);
			this.model.on('change:ismultishipto', jQuery.proxy(this, 'render'), this);
		}

	,	eventHandlersOff: function ()
		{
			OrderWizardModuleAddress.prototype.eventHandlersOff.apply(this, arguments);

			this.model.off('change:tempshipaddress', null, this);
			this.model.off('change:ismultishipto', null, this);
		}

	,	changeAddress: function ()
		{
			OrderWizardModuleAddress.prototype.changeAddress.apply(this, arguments);

			if (this.address)
			{
				this.model.trigger('change:' + this.manage);
			}
		}

	,	estimateShipping: function (model, address)
		{
			var	country = address && address.country
			,	state = address && address.state
			,	zip = address && address.zip;

			if (country && zip && (country !== model.previous('country') || zip !== model.previous('zip') || state !== model.previous('state')))
			{
				// TODO: review if required
				var addresses = this.model.get('addresses')
				,	address_id = country + '-'+ state +'--' + zip + '----null'
				,	current_address = addresses.get(address_id);

				if (!current_address)
				{
					addresses.add({
						internalid: address_id
					,	country: country
					,	state: state
					,	zip: zip
					});
				}
				else
				{
					current_address.set({
						country: country
					,	state: state
					,	zip: zip
					});
				}

				if (this.addressId !== address_id)
				{
					model.set({
						shipaddress: address_id
					,	isEstimating: true
					});
				}
			}
			else
			{
				model.set({isEstimating: false});
			}
		}
	});
});