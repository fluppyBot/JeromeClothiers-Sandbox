/*exported service*/
// cart.ss
// ----------------

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



// Service to manage cart items requests
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		var fileInfo = 'Web Site Hosting Files > Live Hosting Files > SSP Applications > SCA QuickStart - Reference > Reference Checkout 2.03.1 > services > live-order.ss';
		var method = request.getMethod()
			// Cart model is defined on ssp library Models.js
		,	LiveOrder = Application.getModel('LiveOrder')
		,	data = JSON.parse(request.getBody() || '{}');
		
		nlapiLogExecution('debug', 'live-order.ss', '[' + fileInfo + ']')

		if (method === 'GET')
		{
			// Sends the response of LiveOrder.get()
			Application.sendContent(LiveOrder.get());
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
				break;

				case 'POST':
					/**
					var stLog = '';
					var stData = JSON.stringify(data);
					var objData = JSON.parse(stData);
					
					var arrObjLines = objData['lines'];
					var arrObjLinesTotal = (!isNullOrEmpty(arrObjLines)) ? arrObjLines.length : 0;
					
					for (var dx = 0; dx < arrObjLinesTotal; dx++)
					{
						var objOptions = arrObjLines[dx]['options'];
						
						for (var xj in objOptions)
						{
							if (xj == 'custcol_avt_date_needed')
							{
								var dateNeededValue = objOptions[xj];
								stLog += 'dateNeededValue: ' + dateNeededValue + '; ';
								
								if (dateNeededValue == '1/1/1900')
								{
									objData['lines'][dx]['options'][xj] = '';
								}
							}
						}
					}
					
					//nlapiLogExecution('debug', 'POST >> live-order.ss >> data >> stLog', stLog)
					**/

					// Updates the order with the passed in data
					LiveOrder.update(data);


					// Gets the status
					var order_info = LiveOrder.get();
					
					//nlapiLogExecution('debug', 'POST >> live-order.ss >> LiveOrder', JSON.stringify(LiveOrder))

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