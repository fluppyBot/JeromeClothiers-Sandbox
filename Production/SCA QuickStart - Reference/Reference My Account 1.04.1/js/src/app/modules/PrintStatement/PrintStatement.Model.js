define('PrintStatement.Model', function ()
{
	'use strict';

	return Backbone.Model.extend({

		urlRoot: 'services/print-statement.ss'

	,	parse: function (result)
		{
			return result;
		}
	});
});