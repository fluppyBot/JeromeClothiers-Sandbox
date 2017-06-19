/*
* Copyright NetSuite, Inc. 2014 All rights reserved.
* The following code is a demo prototype. Due to time constraints of a demo,
* the code may contain bugs, may not accurately reflect user requirements
* and may not be the best approach. Actual implementation should not reuse
* this code without due verification.

* @Author: Eduardo Souto
* @Date:   2014-01-08 12:31:28
* @Last Modified by:   dcardozo
* @Last Modified time: 2014-08-05 16:35:19
*/

/**
 * Production / Staging product filters
 */
(function (Checkout)
{
    'use strict';

    Checkout.on('beforeStart', function(view) {

        var successCallback = function(data) {
            var category_filters = '',
                type_filters = '',
                brand_filters = '',
                formatFilterName = function(filter) {
                    return filter.name
                        .replace(/&/gi, '-AND-')
                        .replace(/ /gi, '-')
                        .replace(/\+/gi, '-');
                };

            if (data) {
                //SC.ENVIRONMENT.enabled_categories = data.enabled_categories;
                //SC.ENVIRONMENT.enabled_types = data.enabled_types;
                SC.ENVIRONMENT.enabled_brands = data.enabled_brands;
                SC.ENVIRONMENT.customer_mode = data.customer_mode;
                SC.ENVIRONMENT.customer_loc = data.customer_location;
                // Theme
                if (data.theme && data.theme_url) {
                    jQuery('<link>')
                        .appendTo('body')
                        .attr({type : 'text/css', rel : 'stylesheet'})
                        .attr('href', data.theme_url);
                }

            }
        };

        // if (SC.ENVIRONMENT.PROFILE && SC.ENVIRONMENT.PROFILE.internalid) {
        //     var companyId = SC.ENVIRONMENT.companyId,
        //         customerId = SC.ENVIRONMENT.PROFILE.internalid,
        //         scriptId = "customscript_customer_catalog_data",
        //         deployId = "customdeploy_catalog_data_deploy",
        //         url = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId + "&compid=" + companyId + "&customerId=" + customerId;
        //
        //     jQuery.ajax({
        //         url: url,
        //         type: "GET",
        //         timeout: 10000,
        //         dataType: "jsonp",
        //         async: false,
        //         success: function(data) {
        //             console.log('Success');
        //             successCallback(data);
        //         },
        //         error: function(jqXHR, status, error) {
        //             console.log('Error');
        //             console.log('Error when requesting audiences for the current user: ' + error);
        //         }
        //     });
        // }

    });

}(SC.Application('Checkout')));
