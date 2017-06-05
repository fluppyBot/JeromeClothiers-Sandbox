define('CreditMemo.Collection', ['CreditMemo.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({

		model: Model

	,	url: 'services/credit-memo.ss'

	,	parse: function (result)
		{
			return result.records;
		}
	,	comparator: function (item)
		{
			var date = item.get('trandate');
			if (date instanceof Date)
			{
				return date.getTime();
			}
			else if (typeof date === 'number')
			{
				return date;
			}
			else if (typeof date === 'string')
			{
				return Date.parse(date);
			}
		}
	});
});