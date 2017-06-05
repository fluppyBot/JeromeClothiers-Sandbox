/*exported service*/
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		//Only can get an order if you are logged in
		if (session.isLoggedIn())
		{
			var method = request.getMethod()
			,	id = request.getParameter('internalid')
			//  Order model is defined on ssp library Models.js
			,	Deposit = Application.getModel('Deposit')
			,	data = JSON.parse(request.getBody() || '{}');
			
			switch (method)
			{
				case 'GET':
					Application.sendContent(Deposit.get(id));
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