(function (application) {

    'use strict';

    application.on('beforeStartCoreApp', function() {

        var configuration = application.Configuration;

        application.addModule('OrderWizard.Step.Ext');

        _.extend(configuration, {

        });

    });


}(SC.Application('Checkout')));