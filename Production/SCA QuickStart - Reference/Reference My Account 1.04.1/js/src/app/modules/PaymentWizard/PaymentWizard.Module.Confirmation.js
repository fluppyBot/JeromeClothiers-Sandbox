define('PaymentWizard.Module.Confirmation', ['Wizard.Module'], function (WizardModule)
{
	'use strict';

	return WizardModule.extend({
 
		template: 'payment_wizard_confirmation_module'

	,	future: function ()
		{
			var model = this.wizard.model;

			if (model.get('confirmation'))
			{
				model.unset('confirmation', {silent: true});
			}
		}
	});
});