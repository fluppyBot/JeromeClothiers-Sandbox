(function (application) {

    'use strict';

    application.on('beforeStartApp', function() {

        var configuration = application.Configuration;

        _.extend(configuration, {

        });

    });
    
}(SC.Application('Checkout')));