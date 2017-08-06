define('PaymentWizard.Module.CreditTransaction', ['Wizard.Module', 'PaymentWizard.EditAmount.View'], function (WizardModule, EditAmountView)
{
	'use strict';

	return WizardModule.extend({

		template: 'payment_wizard_credit_transaction_module'

	,	events: {
			'click [data-type="transaction"]:not(.disabled)': 'toggleTransactionHandler'
		,	'click [data-type="transaction"] [data-action="edit"]': 'editTransaction'
		}

	,	initialize: function (options)
		{
			this.transaction_type = options.transaction_type;
			this.wizard = options.wizard;
			this.application = this.wizard.application;
			this.addEventListeners();
		}

	,	render: function ()
		{
			this.collection = this.wizard.model.get(this.transaction_type === 'credit' ? 'credits' : 'deposits');
			if (this.collection.length)
			{
				this._render();
			}
		}

	,	addEventListeners: function ()
		{
			this.wizard.model.on('change:credits_total', jQuery.proxy(this, 'render'));
			this.wizard.model.on('change:deposits_total', jQuery.proxy(this, 'render'));
		}

	,	toggleTransactionHandler: function (e)
		{
			this.toggleTransaction(jQuery(e.target).closest('[data-type="transaction"]').data('id'));
		}

	,	toggleTransaction: function (transaction_id)
		{
			var transaction = this.collection.get(transaction_id);

			if (transaction)
			{
				this[transaction.get('apply') ? 'unselectTransaction' : 'selectTransaction'](transaction);
				this.render();
			}
		}

	,	selectTransaction: function (transaction)
		{
			if (transaction)
			{
				transaction.set('checked', true);
			}

			if (this.transaction_type === 'credit')
			{
				return this.application.getLivePayment().selectCredit(transaction.id);
			}
			else
			{
				return this.application.getLivePayment().selectDeposit(transaction.id);
			}
			
		}

	,	unselectTransaction: function (transaction)
		{
			if (transaction)
			{
				transaction.set('checked', false);
			}

			if (this.transaction_type === 'credit')
			{
				return this.application.getLivePayment().unselectCredit(transaction.id);
			}
			else
			{
				return this.application.getLivePayment().unselectDeposit(transaction.id);
			}

		}

	,	editTransaction: function (e)
		{
			var transaction_id = jQuery(e.target).parents('[data-type="transaction"]').data('id')
			,	transaction = this.collection.get(transaction_id);

			e.preventDefault();
			e.stopPropagation();

			this.application.getLayout().showInModal(
				new EditAmountView({
					application: this.application
				,	parentView: this
				,	model: transaction
				,	type: this.transaction_type
				})
			,	{application: this.application}
			);
		}
	});
});