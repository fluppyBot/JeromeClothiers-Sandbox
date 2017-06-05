define('PaymentWizard.CreditTransaction.Model', function ()
{
	'use strict';

	function validateAmountRemaining(value, name, form)
	{
		if (isNaN(parseFloat(value)))
		{
			return _('The amount to apply is not a valid number').translate();
		}
		
		if (value <= 0)
		{
			return _('The amount to apply has to be positive').translate();
		}

		if (value > form.remaining)
		{
			return _('The amount to apply cannot exceed the remaining').translate();
		}

		if (form.orderTotal < 0)
		{
			return _('The amount to apply cannot exceed the remaining order total').translate();
		}
	}

	return Backbone.Model.extend({

			validation: {
				amount: {
					fn: validateAmountRemaining
				}
			}

		,	initialize: function ()
			{
				// TODO: This should be returned from the server
				if (!this.get('type'))
				{
					this.set('type', 'Deposit');
				}
			}
	});
});