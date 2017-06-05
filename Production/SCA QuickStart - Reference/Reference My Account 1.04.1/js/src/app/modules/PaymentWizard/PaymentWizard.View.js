// OrderWizzard.View.js
// --------------------
//
define('PaymentWizard.View', ['Wizard.View'], function (WizardView)
{
	'use strict';

	return WizardView.extend({
		
		template: 'payment_wizard_layout'

	,	bodyClass: 'force-hide-side-nav'

    ,   initialize: function ()
        {
            WizardView.prototype.initialize.apply(this, arguments);
            this.title = _('Make a Payment').translate();
        }
    ,	showContent: function()
		{
			var Layout = this.options.application.getLayout();
			WizardView.prototype.showContent.apply(this, arguments).done(function()
			{
				Layout.hideBreadcrumb();
			});
		}
	});
});