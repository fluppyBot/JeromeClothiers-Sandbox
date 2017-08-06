/*exported service*/
// live-payment.ss
// ----------------
// Service to manage cart items requests
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		// If we are not in the checkout OR we are logged in
		// When on store, login in is not required
		// when on checkout, login is required
		if (session.isLoggedIn())
		{
			var method = request.getMethod()
				// Live payment model is defined on ssp library Models.js
			,	LivePayment = Application.getModel('LivePayment')
			,	data = JSON.parse(request.getBody() || '{}');
			
			switch (method)
			{
				case 'GET':
					Application.sendContent(LivePayment.get());
				break;
				
				case 'POST':
					Application.sendContent(LivePayment.submit(data));
				break;
				
				default:
					// methodNotAllowedError is defined in ssp library commons.js
					Application.sendError(methodNotAllowedError);
			}
		}
		else
		{
			// unauthorizedError is defined in ssp library commons.js			
			Application.sendError(unauthorizedError);
		}
	}
	catch (e)
	{
		Application.sendError(e);
	}
}