define('DynamicContentDelivery', ['Content.EnhancedViews',
    'Content.LandingPages','Content.DataModels'], function (EnhancedViews, LandingPages,DataModels) {

    _.extend(EnhancedViews, {
        renderHTMLContent: function (view, content_zone) {

            var target = content_zone.target,
                app = view.application || view.options.application,
                asTemplate = app.getConfig().dynamicEnhanced;
            // If the target is inside the view
            if (view.$(target).length) {
                if (asTemplate) {
                    view.$(target).html(_.template(content_zone.content)({application:app}));
                } else {
                    view.$(target).html(content_zone.content);
                }
            }
            else {
                // Otherwise, if the target is on the layout
                // we have to make sure it's empty
                view.options.application.getLayout().$(target).filter(':empty').each(function (index, element) {
                    if (asTemplate) {
                        jQuery(element).html(_.template(content_zone.content)({application:app}));
                    }else{
                        jQuery(element).html(content_zone.content);
                    }
                });
            }
        }

    });

    _.extend(LandingPages.Router.prototype, {
        displayLandingPage: function (option) {
            var self = this
                , page_url = option ? unescape(Backbone.history.fragment).replace('?' + option, '') : Backbone.history.fragment
                , view = new LandingPages.View({
                    application: this.Application
                    , layout: this.Application.getLayout()
                });

            DataModels.loadPage('/' + page_url, function (page) {
                if (page) {
                    EnhancedViews.overrideViewSettings(view, page);
                    if(self.Application.getConfig().dynamicLanding) {
                        page.set('content', _.template(page.get('content'))({application:self.Application}));
                    }
                    view.showContent(page);
                }
                else {
                    self.Application.getLayout().notFound();
                }
            });
        }
    })

});