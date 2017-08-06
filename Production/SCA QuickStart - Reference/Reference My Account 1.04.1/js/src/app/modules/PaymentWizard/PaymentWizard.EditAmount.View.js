// OrderWizard.EditDeposit.View.js
// --------------------
//
define('PaymentWizard.EditAmount.View', function ()
{
	'use strict';

	return Backbone.View.extend({

		template: 'payment_wizard_edit_amount_layout'

	,	events:
		{
			'submit [data-action="edit-amount-form"]':'modifyAmount'
		,	'change [name="amount"]':'changedAmount'
		}

	,	changedAmount: function(e)
		{
			var value = parseFloat(jQuery(e.target).val());

			if (this.model.get('discountapplies'))
			{
				if (value === this.model.get('due'))
				{
					this.$('.discountSection').show();
					this.$('.discountWarning').hide();
				}
				else
				{
					this.$('.discountSection').hide();
					this.$('.discountWarning').show();
				}
			}
		}

	,	initialize: function (options)
		{
			this.parentView = options.parentView;
			this.model = options.model;
			this.type = options.type;

			if (this.type === 'invoice')
			{
				this.original_amount_attribute = 'total';
				this.amount_due_attribute = 'due';
				this.input_label = _('Amount to Pay').translate();
				this.original_amount_label  = _('Original Amount').translate();
				this.amount_due_label  = _('Amount Due').translate();
				this.page_header = _('Invoice #$(0)').translate(this.model.get('refnum'));
				this.title = _('Amount to pay for invoice #$(0)').translate(this.model.get('refnum'));
			}
			else if (this.type === 'deposit')
			{
				this.input_label = _('Amount to apply').translate();
				this.original_amount_label  = _('Remaining amount').translate();
				this.original_amount_attribute = 'remaining';
				this.page_header = _('Deposit #$(0)').translate(this.model.get('refnum'));
				this.title = _('Amount to apply for deposit #$(0)').translate(this.model.get('refnum'));
			}
			else if (this.type === 'credit')
			{
				this.input_label = _('Amount to apply').translate();
				this.original_amount_attribute = 'remaining';
				this.original_amount_label  = _('Remaining amount').translate();
				this.page_header = _('$(0) #$(1)').translate(this.model.get('type'), this.model.get('refnum'));
				this.title = _('Amount to apply for credit #$(0)').translate(this.model.get('refnum'));
			}

			this.page_header = '<b>'+ this.page_header.toUpperCase() + '</b>';
		}

	,	modifyAmount: function (e)
		{
			var	model = this.model

			,	original_amount = model.get('amount')
			,	new_amount = parseFloat(this.$('.amountToPayInput').val())
			
			,	wizard_model = this.parentView.wizard.model
			,	original_total = model.get('orderTotal') || wizard_model.calculeTotal(true);

			e.preventDefault();

			if (model.get('discountapplies') && new_amount === model.get('due'))
			{
				new_amount = model.get('duewithdiscount');
			}

			model
				.set('amount', new_amount)
				.set('orderTotal', wizard_model.calculeTotal(true))
				.validate();

			if (model.isValid())
			{
				model.set('amount_formatted', _.formatCurrency(new_amount));
				
				if (this.type === 'invoice')
				{
					wizard_model.distributeCredits();
				}
				else
				{
					wizard_model.calculeTotal();
				}
				
				this.$containerModal.modal('hide');
				this.destroy();
			}
			else
			{
				model.set({
					amount: original_amount
				,	orderTotal: original_total
				});
			}
		}
	});
});