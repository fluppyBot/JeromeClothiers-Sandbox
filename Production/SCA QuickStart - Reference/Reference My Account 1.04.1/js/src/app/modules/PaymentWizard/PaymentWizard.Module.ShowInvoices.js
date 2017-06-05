define('PaymentWizard.Module.ShowInvoices', ['Wizard.Module','Invoice.Collection'], function (WizardModule, InvoiceCollection)
{
	'use strict';

	return WizardModule.extend({
 
		template: 'payment_wizard_showinvoices_module'

	,	initialize: function (options)
		{
			this.wizard = options.wizard;
			this.wizard.model.on('change:confirmation', jQuery.proxy(this, 'render'));
		}
	,	render: function()
		{
			if (this.wizard.model.get('confirmation'))
			{
				this.invoices = new InvoiceCollection(_.where(this.wizard.model.get('confirmation').invoices, {apply: true}));
			}
			else
			{
				this.invoices = this.wizard.model.getSelectedInvoices();
			}
			this._render();
		}
	});
});