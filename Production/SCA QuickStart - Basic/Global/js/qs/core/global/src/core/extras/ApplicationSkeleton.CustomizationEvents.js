(function (SC) {

    'use strict';

    _.each(SC._applications, function(application) {
        application.on('beforeStart', function(){
            application.trigger('beforeStartCoreGlobal');
            application.trigger('beforeStartCoreApp');
            application.trigger('beforeStartGlobal');
            application.trigger('beforeStartApp');
        });

        application.on('afterModulesLoaded', function(){
            application.trigger('afterModulesLoadedCoreGlobal');
            application.trigger('afterModulesLoadedCoreApp');
            application.trigger('afterModulesLoadedGlobal');
            application.trigger('afterModulesLoadedApp');
        });

        application.on('afterStart', function(){
            application.trigger('afterStartCoreGlobal');
            application.trigger('afterStartCoreApp');
            application.trigger('afterStartGlobal');
            application.trigger('afterStartApp');
        });
    });

}(SC));