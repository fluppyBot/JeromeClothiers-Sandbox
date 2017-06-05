define('OrderWizard.Module.Proxy.Shipmethod',
	['OrderWizard.Module.Proxy', 'OrderWizard.Module.Shipmethod', 'OrderWizard.Module.MultiShipTo.Shipmethod', 'OrderWizard.Module.MultiShipTo.NonShippableItems'],
	function (OrderWizardModuleProxy, ShipmethodSingleAddress, ShipmethodMultiShipTo, NonShippableItemList)
{
	'use strict';

	return OrderWizardModuleProxy.extend({

		initialize: function ()
		{
			this.modules = [
				{
					constr: ShipmethodSingleAddress
				,	isActive: function ()
					{
						return !this.wizard.model.get('ismultishipto');
					}
				,	updateEvents: 'ismultishiptoUpdated'
				}
			,	{
					constr: NonShippableItemList
				}
			,	{
					constr: ShipmethodMultiShipTo
				,	isActive: function ()
					{
						return this.wizard.model.get('ismultishipto');
					}
				}
			];

			OrderWizardModuleProxy.prototype.initialize.apply(this, arguments);
		}
	});
});