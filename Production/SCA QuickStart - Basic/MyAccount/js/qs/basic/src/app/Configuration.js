(function (application) {

    'use strict';

    application.on('beforeStartApp', function() {

        var configuration = application.Configuration;
		application.addModule('FitProFile');

        _.extend(configuration, {

        });

    });

}(SC.Application('MyAccount')));