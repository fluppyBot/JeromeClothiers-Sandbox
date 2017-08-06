define('PaymentWizard', ['PaymentWizard.View', 'PaymentWizard.Step', 'PaymentWizard.Router'], function (View, Step, Router)
{
	'use strict';

	return	{
		View: View
	,	Step: Step
	,	Router: Router
	,	mountToApp: function (application)
		{
			var Layout = application.getLayout();

			_.extend(Layout, {
				updateLayout: function()
				{
					this.updateHeader();
					this.updateFooter();
				}
			});
			
			_.extend(Layout.events, {
				'click [data-action="update-layout"]' : 'updateLayout'
			});

			return new Router(application, {
				profile: application.getUser()
			,	model: application.getLivePayment()
			,	steps: application.getConfig('paymentWizardSteps')
			});
		}
	};
});
