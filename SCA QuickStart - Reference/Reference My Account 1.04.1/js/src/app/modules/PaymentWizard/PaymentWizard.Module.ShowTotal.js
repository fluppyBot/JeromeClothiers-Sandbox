define('PaymentWizard.Module.ShowTotal', ['Wizard.Module'], function (WizardModule)
{
	'use strict';

	return WizardModule.extend({
 
		template: 'payment_wizard_showtotal_module'

	,	initialize: function (options)
		{
			this.wizard = options.wizard;
			this.wizard.model.on('change:payment', jQuery.proxy(this, 'render'));
		}
	});
});