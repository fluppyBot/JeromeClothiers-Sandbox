/* global Application:false */
function service (request)
{
    'use strict';
    // Application is defined in ssp library commons.js
    try
    {

        var method = request.getMethod(),
            id = request.getParameter('internalid'),
            data = JSON.parse(request.getBody() || '{}'),
            BackInStockNotification = Application.getModel('BackInStockNotification');

        switch (method)
        {
            case 'GET':
                if(id)
                {
                    Application.sendContent(BackInStockNotification.get(id));
                } else {

                    var list_header_data = {
                        order: request.getParameter('order'),
                        sort: request.getParameter('sort'),
                        page: request.getParameter('page')
                    };

                    Application.sendContent(BackInStockNotification.list(list_header_data));
                }
                break;
            case 'POST':
                var resultId = BackInStockNotification.post(data);
                Application.sendContent(BackInStockNotification.get(resultId,true));

                break;
            case 'DELETE':
                BackInStockNotification.delete(id);
                Application.sendContent({'status': 'ok'});
                break;
            default:
                return Application.sendError(methodNotAllowedError);
        }

    }
    catch (e)
    {
        Application.sendError(e);
    }
}