/* exported service */
function service (request)
{
	'use strict';

	try
	{
		if (session.isLoggedIn())
		{
			var method = request.getMethod()
			,	id = request.getParameter('internalid')
			,	Quote = Application.getModel('Quote');

			switch (method)
			{
				case 'GET':
					Application.sendContent(id ? Quote.get(id) : Quote.list({
						filter: request.getParameter('filter')
					,	order: request.getParameter('order')
					,	sort: request.getParameter('sort')
					,	from: request.getParameter('from')
					,	to: request.getParameter('to')
					,	page: request.getParameter('page')
					}));
				break;

				default: 
					Application.sendError(methodNotAllowedError);
			}
		}
		else
		{
			Application.sendError(unauthorizedError);
		}
	}
	catch (e)
	{
		Application.sendError(e);
	}
}