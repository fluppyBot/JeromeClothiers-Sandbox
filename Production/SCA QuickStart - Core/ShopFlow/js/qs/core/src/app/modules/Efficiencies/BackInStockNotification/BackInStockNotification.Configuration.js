/**
 This file is provided just for reference.
 Add the content to your Configuration file.
 */
(function (SC) {

    'use strict';

    var keys = _.keys(SC._applications),
        application= SC._applications[keys[0]];

    /* We're exporting two different submodules, one to each SSP App */
    if(application.name === 'Shopping')
    {
        application.Configuration.modules.push('BackInStockNotification');
    }
    if(application.name === 'MyAccount')
    {
        application.Configuration.modules.push('BackInStockNotificationAdmin');
    }

}(SC));