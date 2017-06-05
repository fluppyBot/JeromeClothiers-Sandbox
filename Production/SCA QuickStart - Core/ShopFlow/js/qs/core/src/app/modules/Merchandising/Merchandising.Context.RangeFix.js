define('Merchandising.Context.RangeFix', ['Merchandising.Context'], function(MerchandisingContext) {

    'use strict';

    _.extend(MerchandisingContext.prototype, {

        getFilters: function (filters, isWithin)
        {
            var parsed_filters = this.callHandler('getFilters', filters, isWithin);

            if (!parsed_filters)
            {
                parsed_filters = {};

                _.each(filters, function (values, key)
                {
                    values = _.without(values, '$current');

                    if (values.length)
                    {
                        var comma = '';
                        _.each(values, function(value) {
                            if(_.isObject(value) && ('to' in value) && ('from' in value)) {
                                parsed_filters[key+'.to'] = value.to;
                                parsed_filters[key+'.from'] = value.from;
                            } else {
                                if(typeof parsed_filters[key] === 'undefined') {
                                    parsed_filters[key] = '';
                                }
                                parsed_filters[key] += comma+value;
                                comma = ',';
                            }
                        });
                    }
                });
            }

            return parsed_filters;
        }

    });

});