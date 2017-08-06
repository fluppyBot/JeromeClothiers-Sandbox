// Profile.Model.js
// -----------------------
// Model for handling addresses (CRUD)
define('Profile.Model', function ()
{
	'use strict';

	return Backbone.Model.extend(
	{
		validation: {
			name: { required: true, msg: _('Profile Name is required').translate() }
		,	custrecord_fp_product_type: { required: true, msg: _('Product Type is required').translate() }
		,	custrecord_fp_measure_type: { required: true, msg: _('Measurement Type is required').translate() }
		}
	});
});