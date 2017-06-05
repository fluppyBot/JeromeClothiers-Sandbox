define('Facets.Model.SortFix', ['Facets.Model'], function(Model) {
    _.extend(Model.prototype, {
        fetch: _.wrap(Model.prototype.fetch, function(fn, options) {
            if(options && options.data && options.data.sort && options.data.sort === 'relevance:asc') {
                delete options.data.sort;
            }
            return fn.apply(this, Array.prototype.slice.call(arguments, 1));
        })
    });
});