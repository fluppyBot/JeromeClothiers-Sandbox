define('Quote.Model', ['OrderLine.Collection'], function (OrderLineCollection)
{
	'use strict';

	return Backbone.Model.extend({

		urlRoot: 'services/quote.ss'

	,   initialize: function (attributes)
		{
			// lineItems
			this.on('change:lineItems', function (model, lineItems)
			{
				model.set('lineItems', new OrderLineCollection(lineItems), {silent: true});
			});

			this.trigger('change:lineItems', this, attributes && attributes.lineItems || []); 
		}
	});
});