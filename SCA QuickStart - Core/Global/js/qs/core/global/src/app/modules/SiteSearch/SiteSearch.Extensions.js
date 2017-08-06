define('SiteSearch.Extensions', ['SiteSearch'], function(Module) {

    'use strict';

    var SiteSearch = Module.SiteSearch;

    var currentSearchOptions = function ()
    {
        var newOptions = [],
            currentOptions = SC.Utils.parseUrlOptions(window.location.href);

        _.each(currentOptions, function (value, key)
        {
            var lowerCaseKey = key.toLowerCase();

            if (lowerCaseKey === 'order' || lowerCaseKey === 'show' ||  lowerCaseKey === 'display')
            {
                newOptions.push(lowerCaseKey + '=' + value);
            }
        });

        var newOptionsStr = newOptions.join('&');

        if (newOptionsStr.length > 0)
        {
            newOptionsStr = '&' + newOptionsStr;
        }

        return newOptionsStr;
    };

    _.extend(SiteSearch, {

        /* extra utilities */
        getShoppingTouchpointUrl: function(fragment) {
            var target_touchpoint_name = 'home',
                touchpoints = this.getApplication().getConfig('siteSettings.touchpoints'),
                target_touchpoint = (touchpoints ? touchpoints[target_touchpoint_name] : '') || '';
                console.log('getShoppingTouchpointUrl')
                console.log(target_touchpoint + (fragment? (~target_touchpoint.indexOf('?') ? '&' : '?') + 'fragment=' + encodeURIComponent(fragment) : ''));
            return _.fixUrl(target_touchpoint + (fragment? (~target_touchpoint.indexOf('?') ? '&' : '?') + 'fragment=' + encodeURIComponent(fragment) : ''));
        },
        getKeywordSearchUrl: function(value) {
            return this.getShoppingTouchpointUrl(this.getKeywordSearchFragment(value, true));
        },
        /* ************** */

        /* if no keyword, go to search page without ?keywords= param */
        getKeywordSearchFragment: function(value, not_encode) {
            var searchFragment = this.getApplication().getConfig('defaultSearchUrl'),
                searchParams = '';
            if(value !== '') {
                searchParams += 'keywords='+ value;
            }
            searchParams += currentSearchOptions();
            if(searchParams.length > 0) {
                searchFragment += '?'+searchParams;
            }
            return not_encode? searchFragment : encodeURI(searchFragment);
        },

        processAnchorTags: function (e, typeahead)
        {
            var $anchor, value, item, path, self = this;

            typeahead.$menu.find('a').each(function (index, anchor)
            {
                $anchor = jQuery(anchor);
                value = $anchor.parent().data('value');
                item = typeahead.results[value];
                path = item ? item.get('_url') : self.getKeywordSearchFragment(value.replace('see-all-', ''));

                $anchor
                    .attr({
                        'href': path,
                        'data-touchpoint': 'home',
                        'data-hashtag': '#' + path
                    }).click(function ()
                    {
                        typeahead.$menu.hide();
                    });

                // and manually fix the link because it is a touchpoint
                self.getApplication().getLayout().touchpointMousedown({currentTarget: $anchor});
            });

            typeahead.$menu.off('click');
        }

    });

});
