(function (SC) {

    'use strict';

    _.each(SC._applications, function(application) {
        application.on('beforeStart', function(){
            application.trigger('beforeStartGlobal');
            application.trigger('beforeStartApp');
        });

        application.on('afterModulesLoaded', function(){
            application.trigger('afterModulesLoadedGlobal');
            application.trigger('afterModulesLoadedApp');
        });

        application.on('afterStart', function(){
            application.trigger('afterStartGlobal');
            application.trigger('afterStartApp');
        });
    });

}(SC));