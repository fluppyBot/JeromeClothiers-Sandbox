(function(SC) {

    'use strict';

    var ApplicationSkeleton = SC.ApplicationSkeleton;

    function Globals(Application, Data) {
        if (!(this instanceof Globals)) {
            return new Globals(Application, Data);
        }

        this.application = Application;
        this.data = Data || {}; // stores reference to SC.ENVIRONMENT.GLOBALS
        this.entries = {};
    }

    // add methods and variables
    _.extend(Globals.prototype, {

        getData: function(name, remove) {
            if(name) {
                var data = null;
                var found = (name in this.data);
                if(!found) {
                    name = name.toUpperCase();
                    found = (name in this.data);
                }
                if(found) {
                    data = this.data[name];
                    if(remove) {
                        delete this.data[name];
                    }
                }
                return data;
            }
            return null;
        },

        get: function(key) {
            return this.entries[key];
        },
        set: function(key, value) {
            this.entries[key] = value;
        }

    });

    // extend with Backbone Events
    _.extend(Globals.prototype, Backbone.Events);

    // add to Application
    _.extend(ApplicationSkeleton.prototype, {

        Globals: Globals,

        initGlobals: function(Data) {
            if(!this._globalsInstance) {
                this._globalsInstance =  new this.Globals(this, Data);
            }
            return this._globalsInstance;
        },

        getGlobals: function() {
            return this._globalsInstance;
        },

        getGlobal: function(key) {
            return this.getGlobals().get(key);
        }

    });

}(SC));