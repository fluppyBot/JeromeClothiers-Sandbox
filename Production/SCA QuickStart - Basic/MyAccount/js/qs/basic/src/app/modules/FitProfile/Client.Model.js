// Client.Model.js
// -----------------------
// Model for handling addresses (CRUD)
define('Client.Model', function ()
{
	'use strict';

	return Backbone.Model.extend(
	{
		validation: {
			custrecord_tc_first_name: { required: true, msg: _('First Name is required').translate() }
		,	custrecord_tc_last_name: { required: true, msg: _('Last Name is required').translate() }
		,	custrecord_tc_email: { required: true, msg: _('Email is required').translate() }
		,	custrecord_tc_phone: { fn: _.validatePhone }
		}
	});
});