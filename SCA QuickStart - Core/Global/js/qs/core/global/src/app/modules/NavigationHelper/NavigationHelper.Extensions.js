define('NavigationHelper.Extensions', ['NavigationHelper'], function() {

    'use strict';

    return {
        mountToApp: function(application) {

            var Layout = application.getLayout();

            // Touchpoints navigation
            _.extend(Layout, {

                hrefApplicationPrefixes: ['mailto', 'tel'],

                isLinkWithApplicationPrefix: function(href) {
                    return ~_.indexOf(this.hrefApplicationPrefixes, href.split(':')[0]);
                },
                isKeepHref: function($element) {
                    return $element.attr('data-keep-href') === 'true';
                },

                clickEventListener: _.wrap(Layout.clickEventListener, function(fn, e) {

                    var anchor = jQuery(e.currentTarget),
                        href = this.getUrl(anchor) || '#';

                    if(this.isKeepHref(anchor)) {
                        return;
                    }

                    if(this.isLinkWithApplicationPrefix(href)) {
                        e.preventDefault();
                        window.location.href = href;
                    } else {
                        fn.apply(this, Array.prototype.slice.call(arguments, 1));
                    }

                }),

                fixNoPushStateLink: _.wrap(Layout.fixNoPushStateLink, function(fn, e) {

                    var anchor = jQuery(e.currentTarget),
                        href = this.getUrl(anchor) || '#';

                    if(this.isLinkWithApplicationPrefix(href)) {
                        return;
                    }
                    if(this.isKeepHref(anchor)) {
                        return;
                    }

                    return fn.apply(this, Array.prototype.slice.call(arguments, 1));
                })

            });

        }
    };

});