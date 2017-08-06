(function(application) {

    'use strict';

    // Default SCA fix: trigger beforeStart before loading modules so users have a chance to include new modules in that method.
    application.start = function(done_fn)
    {

        this.trigger('beforeStart', this);

        var wizard_modules = _(this.getConfig('checkoutSteps')).chain().pluck('steps').flatten().pluck('modules').flatten().value();

        wizard_modules = _.uniq(wizard_modules);

        this.Configuration.modules = _.union(this.getConfig('modules'), wizard_modules);

        var self = this
        // Here we will store
        ,	module_options = {}
        // we get the list of modules from the config file
        ,	modules_list = _.map(self.getConfig('modules', []), function (module)
            {
                // we check all the options are strings
                if (_.isString(module))
                {
                    return module;
                }
                // for the ones that are the expectation is that it's an array,
                // where the 1st index is the name of the modules and
                // the rest are options for the mountToApp function
                else if (_.isArray(module))
                {
                    module_options[module[0]] = module.slice(1);
                    return module[0];
                }
            });

        // we use require.js to load the modules
        // require.js takes care of the dependencies between modules
        require(modules_list, function ()
        {
            // then we set the modules to the aplication
            // the keys are the modules_list (names)
            // and the values are the loaded modules returned in the arguments by require.js
            self.modules = _.object(modules_list, arguments);

            self.modulesMountToAppResult = {};

            // we mount each module to our application
            _.each(self.modules, function (module, module_name)
            {
                // We pass the application and the arguments from the config file to the mount to app function
                var mount_to_app_arguments = _.union([self], module_options[module_name] || []);
                if (module && _.isFunction(module.mountToApp))
                {
                    self.modulesMountToAppResult[module_name] = module.mountToApp.apply(module, mount_to_app_arguments);
                }
            });

            // This checks if you have registered modules
            if (!Backbone.history)
            {
                throw new Error('No Backbone.Router has been initialized (Hint: Are your modules properly set?).');
            }

            self.trigger('afterModulesLoaded', self);

            done_fn && _.isFunction(done_fn) && done_fn(self);

            self.trigger('afterStart', self);
        });
    };

}(SC.Application('Checkout')));