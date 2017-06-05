(function (SC)
{
    'use strict';

    var ApplicationSkeleton = SC.ApplicationSkeleton;

    ApplicationSkeleton.prototype.Configuration = {
        modules : []
    };

    _.extend(ApplicationSkeleton.prototype, {

        configModule: function(name,config){
            var index = -1;
            _.each(this.Configuration.modules, function(module,key){
                if(_.isArray(module)){
                    if(module[0] === name){
                        index = key;
                    }
                } else {
                    if(module === name){
                        index = key;
                    }
                }
            });
            if(index !== -1){
                this.Configuration.modules[index] = [name,config];
            }
        },
        removeModule: function(name){
            var position = _.indexOf(this.Configuration.modules, name);
            if(position !== -1){
                this.Configuration.modules.splice(position, 1);
            }
        },
        addModule: function(module){
            this.Configuration.modules.push(module);
        }

    });

}(SC));