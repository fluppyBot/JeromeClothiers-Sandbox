define('CreditMemo.Model', ['ItemDetails.Collection'], function (ItemDetailsCollection)
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

		urlRoot: 'services/credit-memo.ss'

		,	validation: {
				amount: {
					fn: validateAmountRemaining
				}
			}

	,	initialize: function (attributes)
		{
			this.on('change:items', function (model, items)
			{
				model.set('items', new ItemDetailsCollection(items), {silent: true});
			});

			this.trigger('change:items', this, attributes && attributes.items || []);
		}
	});
});