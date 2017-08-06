(function (application) {

    'use strict';

    application.on('beforeStartCoreApp', function() {

        var configuration = application.Configuration;

        _.extend(configuration, {

        });

    });

}(SC.Application('MyAccount')));