var bigCache = function(name, splitSize) {
    return {
        cache: nlapiGetCache(name),

        put: function(key, data, ttl) {
            var step = splitSize || 100000,
                actual = 0,
                totalLength = data.length;

            while (step * actual < totalLength) {
                this.cache.put(key + actual, data.substring(step * actual, Math.min(totalLength, step * (actual+1))), ttl);
                actual++;
            }
        },

        get: function(key) {
            var i = 0,
                data = '',
                d;

            while (d = this.cache.get(key + i++)) {
                data += d;
            }

            return data;
        },

        remove: function(key) {
            var i = 0;

            while (this.cache.get(key + i)) {
                this.cache.remove(key + i++);
            }
        }
    };
};

Application.defineModel('Category', {

    get: function () {

        'use strict';

        var cache = new bigCache('PS-Categories', SC.Configuration.cache.categoriesChunkSize),
            is_secure = request.getURL().indexOf('https') === 0,
            config = SC.projectConfig.site.categories,
            fulltree = !is_secure || config.secure_enable_subcategories,
            cacheTtl = is_secure ? SC.Configuration.cache.categoriesCheckout : SC.Configuration.cache.categoriesShopping,
            cacheKey = 'categories' + (fulltree ? 'full-' : 'top-'),
            categories;

        var categoriesCache = cache.get(cacheKey);
        if (!categoriesCache) {
            categories = this.fixCategories(session.getSiteCategoryContents({ internalid: config.home_id.toString() }, fulltree), '');
            cache.put(cacheKey, JSON.stringify(categories), cacheTtl);
        }
        else {
            categories = JSON.parse(categoriesCache);
        }

        return categories;
    },

    fixCategories: function (categories, url) {

        'use strict';

        var result = {},
            self = this;

        _.each(categories, function (category) {

            if(category.internalid > 0){
                var category_limited =  _.pick(category, 'itemid','pagetitle','urlcomponent','welcomepagetitle', 'categories', 'internalid', 'storedisplayimage', 'storedisplaythumbnail');
                category_limited.urlcomponent = category_limited.urlcomponent || category_limited.itemid;
                category_limited.url = url ? url + '/' + category_limited.urlcomponent : category_limited.urlcomponent;
                result[category_limited.urlcomponent] = category_limited;

                if (category_limited.categories && category_limited.categories.length) {
                    category_limited.categories = self.fixCategories(category_limited.categories, category_limited.url);
                }
            } else {
                result = self.fixCategories(category.categories);
            }

        });

        return result;
    }

});