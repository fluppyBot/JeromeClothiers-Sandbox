define('LivePayment', ['LivePayment.Model'], function (LivePaymentModel)
{
	'use strict';

	return {
		mountToApp: function(application)
		{
			application.getLivePayment = function ()
			{
				if (!application.livePaymentInstance)
				{
					application.livePaymentInstance = new LivePaymentModel(SC.ENVIRONMENT.LIVEPAYMENT ? SC.ENVIRONMENT.LIVEPAYMENT : {}, {application: application});
				}
				
				return application.livePaymentInstance;
			};
		}
	};
});
