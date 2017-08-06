(function (SC) {

    'use strict';

    // application configuration
    // if needed, the second argument - omitted here - is the application name ('Shopping', 'MyAccount', 'Checkout')
    _.each(SC._applications, function(application) {

        application.on('beforeStartCoreGlobal', function() {

            var configuration = application.Configuration;

            /* add modules */
            application.addModule('Content.EnhancedViews.Extensions');
            application.addModule(['Categories',{ addToNavigationTabs:true, navigationAddMethod: 'prepend' }]);
            application.addModule('Facets.Model.SortFix');
            application.addModule('Facets.Translator.Categories');
            application.addModule('NavigationHelper.Extensions');
            application.addModule('SiteSearch.Extensions');
            application.addModule(['HashScroll', { paramName: 'target', animated: false }]);
            application.addModule('Images');
            application.addModule('DynamicContentDelivery');
            application.addModule('Utils.Extension');
            application.addModule('EmailSignUp');

            configuration.navigationTabs = [];

            application.Configuration.multiImageOption = '';

            application.Configuration.emailSignUp = {
                domain: 'forms.netsuite.com',
                formId: '5',
                hash: '74db45ac85eda91c1fc4'
            };

            _.extend(application.Configuration, {
                logoUrl: '/assets/images/content/logo.png',
                dynamicEnhanced: true,
                dynamicLanding: true
            });

        });

    });

}(SC));