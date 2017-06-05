define('BackInStockNotification.PlugToViewHelper', [], function(){

    'use strict';

    //This is a helper to plug the BIS button without edditing the template. It's not needed, if you want to put
    //the control in other place by editing the template, you can do it.
    //Or you can code the inject on view function of your preference.
    //The example appends it AFTER the product list control
    return {

        injectOnView: function(view,configuration)
        {
            if(configuration.injectOnViewFunction)
            {
                configuration.injectOnViewFunction(view);
            } else {
                view.$('[data-type="product-lists-control"]').after('<div data-type="backinstocknotification-control-placeholder"></div>');
            }

        },
        mountToApp: function(application, configuration)
        {
            var self = this;
            application.getLayout().on('afterAppendView', function (view)
            {
                if (view && view.model && view.model.getPosibleOptions)
                {
                    if(configuration.injectOnViewMode === 'code')
                    {
                        self.injectOnView(view,configuration);
                    }
                }

            });
        }

    };

});