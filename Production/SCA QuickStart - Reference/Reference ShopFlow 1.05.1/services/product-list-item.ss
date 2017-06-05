/*exported service*/
// product-list-item.ss
// ----------------
// Service to manage product list items requests
function service (request)
{
	'use strict';
	
	// Application is defined in ssp library commons.js
	try
	{
		var method = request.getMethod()
		,	data = JSON.parse(request.getBody() || '{}')
		,	id = request.getParameter('internalid') ? request.getParameter('internalid') : data.internalid
		,	product_list_id = request.getParameter('productlistid') ? request.getParameter('productlistid') : data.productlistid
		,	ProductListItem = Application.getModel('ProductListItem');
		
		switch (method)
		{
			case 'GET':
				Application.sendContent(id ? ProductListItem.get(id) : ProductListItem.search(product_list_id, true, {
						sort: request.getParameter('sort') ? request.getParameter('sort') : data.sort // Column name
					,	order: request.getParameter('order') ? request.getParameter('order') : data.order // Sort direction
					,	page: request.getParameter('page') || -1
				}));
			break;

			case 'POST':					
				Application.sendContent(ProductListItem.create(data), {'status': 201});
			break;

			case 'PUT':
				ProductListItem.update(id, data);
				Application.sendContent(ProductListItem.get(id));
			break;

			case 'DELETE':
				ProductListItem.delete(id);
				Application.sendContent({'status': 'ok'});
			break;
				
			default: 
				// methodNotAllowedError is defined in ssp library commons.js
				Application.sendError(methodNotAllowedError);
		}
	}
	catch (e)
	{
		Application.sendError(e);
	}
}