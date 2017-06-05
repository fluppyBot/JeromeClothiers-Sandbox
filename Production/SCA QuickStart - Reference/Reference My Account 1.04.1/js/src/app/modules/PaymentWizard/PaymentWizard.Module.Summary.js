define('PaymentWizard.Module.Summary', ['Wizard.Module'], function (WizardModule)
{
	'use strict';

	return WizardModule.extend({

		template: 'payment_wizard_summary_module'

	,	initialize: function (options)
		{
			this.is_active = false;
			this.options = options;
			this.wizard = options.wizard;

			this.wizard.model.on('change', jQuery.proxy(this, 'render'));
		}

	,	isActive: function()
		{
			return this.is_active;
		}

	,	future: function ()
		{
			this.is_active = false;
		}

	,	present: function ()
		{
			this.is_active = true;
		}

	,	past: function ()
		{
			this.is_active = false;
		}

	,	render: function ()
		{
			this.continueButtonDisabled = '';
			if (this.options.submit)
			{
				this.continueButtonLabel = _('Submit').translate();
			}
			else
			{
				var selected_invoices = this.wizard.model.getSelectedInvoices();
				if (selected_invoices.length)
				{
					this.continueButtonLabel = _('<span class="total-selected-items-quantity">$(0)</span> <span class="btn-continue-label">Selected: Next</span>').translate(selected_invoices.length);
				}
				else
				{
					this.continueButtonDisabled = 'disabled="disabled"';
					this.continueButtonLabel = _('<span class="total-selected-items-quantity">0</span> <span class="btn-continue-label">Selected</span>').translate();
				}
			}

			this._render();

			if (this.isActive())
			{
				this.trigger('change_enable_continue', !this.continueButtonDisabled);
				this.trigger('change_label_continue', this.continueButtonLabel);
			}
		}

	});
});
