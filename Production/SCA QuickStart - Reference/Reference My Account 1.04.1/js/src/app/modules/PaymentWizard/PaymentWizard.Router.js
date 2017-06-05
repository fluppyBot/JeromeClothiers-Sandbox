define('PaymentWizard.Router', ['Wizard.Router', 'PaymentWizard.View', 'PaymentWizard.Step'], function (WizardRouter, PaymentWizardView, PaymentWizardStep)
{
	'use strict';
	
	return WizardRouter.extend({

		view: PaymentWizardView

	,	step: PaymentWizardStep

	,	hidePayment: function ()
		{
			return (!this.model.get('payment') && !this.model.get('confirmation')) || (this.model.get('confirmation') && !this.model.get('confirmation').payment);
		}
	});
});
