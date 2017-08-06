define('Content.EnhancedViews.Extensions', ['Content.EnhancedViews'], function (EnhancedViews) {

    'use strict';

    _.extend(EnhancedViews, {

        enhancePage: _.wrap(EnhancedViews.enhancePage, function (fn, view, Layout) {
            fn.apply(this, Array.prototype.slice.call(arguments, 1));

            if(view instanceof Layout.application.Layout) {
                Layout.trigger('renderAllLayoutEnhancedPageContent', view);
            } else {
                Layout.trigger('renderAllEnhancedPageContent', view);
            }
        })

    });

});