/*exported service*/
function service (request)
{
	'use strict';

	try
	{
		if (session.isLoggedIn())
		{
			var method = request.getMethod()
			,	id = request.getParameter('internalid')
			,	Payment = Application.getModel('Payment')
			,	data = JSON.parse(request.getBody() || '{}');
			
			switch (method)
			{
				case 'GET':
					Application.sendContent(Payment.get(id));
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
