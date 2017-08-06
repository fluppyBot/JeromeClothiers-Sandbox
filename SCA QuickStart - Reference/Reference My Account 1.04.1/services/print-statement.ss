/*exported service*/
// printstatement.ss
// ----------------
// Service to manage print requests
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		//Only can get, modify, update or delete an address if you are logged in
		if (session.isLoggedIn())
		{
			var method = request.getMethod()
			,	data = JSON.parse(request.getBody() || '{}');

			switch (method)
			{
				case 'POST':
					if (context.getPermission('TRAN_STATEMENT') === 2)
					{
						Application.sendContent({'url': Application.getModel('PrintStatement').getUrl(data)});
					}
					else
					{
						Application.sendError(forbiddenError);
					}
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