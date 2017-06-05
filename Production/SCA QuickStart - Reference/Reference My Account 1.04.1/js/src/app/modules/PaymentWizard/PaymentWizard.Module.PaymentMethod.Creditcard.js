// PaymentWizard.Module.PaymentMethod.Creditcard.js
// --------------------------------
// 
define('PaymentWizard.Module.PaymentMethod.Creditcard', ['OrderWizard.Module.PaymentMethod.Creditcard'], function (OrderWizardModulePaymentMethodCreditcard)
{
	'use strict';

	return OrderWizardModulePaymentMethodCreditcard.extend({

			itemsPerRow: 3

		,	showDefaults: true

		,	render: function()
			{
				if (this.wizard.hidePayment())
				{
					this.$el.empty();
				}
				else
				{
					OrderWizardModulePaymentMethodCreditcard.prototype.render.apply(this, arguments);
				}
			}

		,	initialize: function ()
			{
				
				OrderWizardModulePaymentMethodCreditcard.prototype.initialize.apply(this, arguments);
				this.wizard.model.on('change:payment', jQuery.proxy(this, 'changeTotal'));
			}

		,	changeTotal: function ()
			{

				var was = this.model.previous('payment')
				,	was_confirmation = this.model.previous('confirmation')
				,	is_confirmation = this.model.get('confirmation')
				,	is = this.model.get('payment');

				// Changed from or to 0
				if (((was === 0 && is !== 0) || (was !== 0 && is === 0)) && !was_confirmation && !is_confirmation)
				{
					this.render();
				}
			}
	});
});
