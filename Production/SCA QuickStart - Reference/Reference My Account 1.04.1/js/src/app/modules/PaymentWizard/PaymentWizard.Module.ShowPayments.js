// PaymentWizard.Module.ShowPayments.js
// --------------------------------
// 
define('PaymentWizard.Module.ShowPayments', ['OrderWizard.Module.ShowPayments'], function (OrderWizardModuleShowPayments)
{
	'use strict';

	return OrderWizardModuleShowPayments.extend({

		render: function()
		{
			if (this.wizard.hidePayment())
			{
				this.$el.empty();
			}
			else
			{
				OrderWizardModuleShowPayments.prototype.render.apply(this, arguments);
			}
		}
	,	totalChange: jQuery.noop
	});
});