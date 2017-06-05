define('BackInStockNotification',
[
    'BackInStockNotification.Model',
    'BackInStockNotification.Views.Subscribe',
    'BackInStockNotification.PlugToViewHelper'
], function (Model, SubscribeView, Helper)
{
    'use strict';

    return {

        applyBackInStockControl: function (view, $containers, model, application,configuration)
        {

            //function that applies the component only if it accomplish conditions needed of Item Type, and child selected if matrix
            var childs = model.getSelectedMatrixChilds(),
                type = model.get('itemtype');

            if (_.contains(configuration.stockeable_item_types,type) && model.getSelectedMatrixChilds().length <= 1)
            {
                childs.length === 1 ? (model = childs[0]) : (model);
                var stockInfo = model.getStockInfo();
                if(stockInfo.showOutOfStockMessage && !stockInfo.isInStock) //TODO: validate quantityavailable. Document Fields Needed showOutOfStockMessage,isInStock y itemtype. QTYAV?
                {
                    $containers.each(function ()
                    {
                        var $this = jQuery(this);
                        var form = new SubscribeView({
                            application: application,
                            itemModel: model,
                            configuration: configuration
                        });
                        $this.append(form.$el);
                        form.render();

                        //This is for cleanup on the following view. This sucks on reference implmeentation
                        view.application.getLayout().once('beforeAppendView', function ()
                        {
                            form.destroy();
                        });
                    })
                }
            }
        },
        afterAppendViewListener: function(application,configuration,view)
        {
            if (view && view.model && view.model.getPosibleOptions) //If it's an item model, apply the control
            {
                this.applyBackInStockControl(view, view.$('[data-type="backinstocknotification-control-placeholder"]:empty'), view.model, application,configuration);
            }
        },
        mountToApp: function (application)
        {
            var config = application.Configuration,
                bisConfig;

            config.BackInStockNotification = config.BackInStockNotification || {};
            _.extend(config.BackInStockNotification, SC.ENVIRONMENT.Efficiencies.BackInStockNotification);
            _.defaults(config.BackInStockNotification, {
                injectOnViewMode: 'code', //or 'template'
                moduleOn: true
            });
            bisConfig = config.BackInStockNotification;

            if(bisConfig.moduleOn)
            {
                if (bisConfig.injectOnViewMode === 'code')
                {
                    Helper.mountToApp(application, bisConfig);
                }

                application.getLayout().on('afterAppendView', _.bind(_.partial(this.afterAppendViewListener,application,bisConfig),this));

            }
        }
    };
});