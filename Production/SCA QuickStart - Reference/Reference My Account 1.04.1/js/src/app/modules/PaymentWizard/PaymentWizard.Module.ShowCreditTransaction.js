define('PaymentWizard.Module.ShowCreditTransaction', ['Wizard.Module', 'PaymentWizard.CreditTransaction.Collection'], function (WizardModule, CreditTransactionCollection)
{
	'use strict';

	return WizardModule.extend({
 
		template: 'payment_wizard_show_credit_transaction_module'

	,	initialize: function (options)
		{
			this.transaction_type = options.transaction_type;
			this.wizard = options.wizard;
			this.wizard.model.on('change:confirmation', jQuery.proxy(this, 'render'));
		}

	,	render: function()
		{
			var confirmation = this.wizard.model.get('confirmation');

			if (confirmation)
			{
				this.collection = new CreditTransactionCollection(
					_.where(confirmation[this.transaction_type === 'credit' ? 'credits' : 'deposits'], {
						apply: true
					})
				);
			}
			else
			{
				this.collection = this.wizard.model.getAppliedTransactions(this.transaction_type === 'credit' ? 'credits' : 'deposits');
			}

			if (this.collection.length)
			{
				this._render();
			}
		}
	});
});