/*exported service*/
// cart.ss
// ----------------
// Service to manage cart items requests
	var	container = nlapiGetWebContainer();
	var	session = container.getShoppingSession();
	var	settings = session.getSiteSettings();
	var order = container.getShoppingSession().getOrder();
	var stdTagLib = container.getStandardTagLibrary();


function isNullOrEmpty(valueStr)
{
   return(valueStr == null || valueStr == "" || valueStr == undefined); 
}

function isNullOrEmptyObject(obj) 
{
   var hasOwnProperty = Object.prototype.hasOwnProperty;
   
   if (obj.length && obj.length > 0) { return false; }   
   for (var key in obj) { if (hasOwnProperty.call(obj, key)) return false; }
   return true;
}

function isObjectExist(objFld)
{
   var isObjExist = (typeof objFld != "undefined") ? true : false;
   return isObjExist;
}




function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		
		//order.removeAllItems()
		
		var fileInfo = 'Web Site Hosting Files > Live Hosting Files > SSP Applications > SCA QuickStart - Reference > Reference ShopFlow 1.05.1 > services > live-order.ss'
		var method = request.getMethod()
			// Cart model is defined on ssp library Models.js
		,	LiveOrder = Application.getModel('LiveOrder')
		,	data = JSON.parse(request.getBody() || '{}');
		
		nlapiLogExecution('debug', 'live-order.ss', '[' + fileInfo + ']');
		
		

		if (method === 'GET')
		{
			// Sends the response of LiveOrder.get()
			Application.sendContent(LiveOrder.get());


			/**
			var stGetLiveOrder = JSON.stringify(LiveOrder.get());
			var arrObjGetLiveOrder = JSON.parse(stGetLiveOrder) || '{}';
			var arrObjOrderLines = arrObjGetLiveOrder['lines'] || [];
			var arrObjOrderLinesTotal = (!isNullOrEmpty(arrObjOrderLines)) ? arrObjOrderLines.length : 0
			
			for (var dx = 0; dx < arrObjOrderLinesTotal; dx++)
			{
				var opts = arrObjOrderLines[dx]['options'];
				
				var objAvtHoldFabric = {};
				objAvtHoldFabric['name'] = 'Hold Fabric';
				objAvtHoldFabric['id'] = 'custcol_avt_hold_fabric';
				objAvtHoldFabric['value'] = '';
				
				opts.push(objAvtHoldFabric)

				//nlapiLogExecution('debug', 'live-order.ss >> Get >> opts: ', JSON.stringify(opts));
			}
			
			
			//nlapiLogExecution('debug', 'live-order.ss >> Get', JSON.stringify(opt));
			//nlapiLogExecution('debug', 'live-order.ss >> Get',stGetLiveOrder);
			
			Application.sendContent(arrObjGetLiveOrder);
			**/


			
			
		}
		// If we are not in the checkout OR we are logged in
		// When on store, login in is not required
		// when on checkout, login is required
		else if (!~request.getURL().indexOf('https') || session.isLoggedIn())
		{
			switch (method)
			{
				case 'PUT':
					// Pass the data to the LiveOrder's update method and send it response
					LiveOrder.update(data);
					Application.sendContent(LiveOrder.get());

					var stLiveOrder = JSON.stringify(LiveOrder.get());
					nlapiLogExecution('debug', 'live-order.ss >> PUT', stLiveOrder);

				break;

				case 'POST':
					// Updates the order with the passed in data
					LiveOrder.update(data);

					// Gets the status
					var order_info = LiveOrder.get();
					
					nlapiLogExecution('debug', 'POST >> live-order.ss >> order_info', JSON.stringify(order_info))
					

					// Finally Submits the order
					order_info.confirmation = LiveOrder.submit();

					// Update touchpoints after submit order
					order_info.touchpoints = session.getSiteSettings(['touchpoints']).touchpoints;

					Application.sendContent(order_info);
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