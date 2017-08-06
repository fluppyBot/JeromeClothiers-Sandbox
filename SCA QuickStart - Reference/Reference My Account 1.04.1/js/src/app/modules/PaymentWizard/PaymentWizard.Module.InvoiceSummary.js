define('PaymentWizard.Module.InvoiceSummary', ['Wizard.Module'], function (WizardModule)
{
	'use strict';

	return WizardModule.extend({
 
		template: 'payment_wizard_invoice_summary_module'

	,	initialize: function (options)
		{
			this.wizard = options.wizard;
		}
	});
});