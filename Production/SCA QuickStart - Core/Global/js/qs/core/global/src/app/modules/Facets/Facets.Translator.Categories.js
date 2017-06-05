define('Facets.Translator.Categories', ['Facets.Translator', 'Categories'], function(Translator) {

    _.extend(Translator.prototype, {

        getApiParams: function ()
        {
            var params = {};

            _.each(this.facets, function (facet)
            {
                var value = facet.value;
                if (facet.id === 'category') {
                    value = 'Home/'+value;
                }

                switch (facet.config.behavior)
                {
                    case 'range':
                        value = (typeof value === 'object') ? value : {from: 0, to: value};
                        params[facet.id + '.from'] = value.from;
                        params[facet.id + '.to'] = value.to;
                        break;
                    case 'multi':
                        params[facet.id] = value.sort().join(',') ; // this coma is part of the api call so it should not be removed
                        break;
                    default:
                        params[facet.id] =  value;
                }
            });

            params.sort = this.options.order;
            params.limit = this.options.show;
            params.offset = (this.options.show * this.options.page) - this.options.show;

            params.q = this.options.keywords;

            return params;
        }


    });

});
