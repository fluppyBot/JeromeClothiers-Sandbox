define('Images',function(){

    function itemImageFlatten (images)
    {
        if ('url' in images && 'altimagetext' in images)
        {
            return [images];
        }

        return _.flatten(_.map(images, function (item)
        {
            if (_.isArray(item))
            {
                return item;
            }

            return itemImageFlatten(item);
        }));
    }

    return {

    mountToApp: function(application){

        _.extend(application.getConfig().itemKeyMapping, {

            _images: function (item) {
                var result = []
                    , selected_options = item.itemOptions
                    , item_images_detail = item.get('itemimages_detail') || {}
                    , swatch = selected_options && selected_options[application.getConfig('multiImageOption')] || null;

                item_images_detail = item_images_detail.media || item_images_detail;

                if (swatch && item_images_detail[swatch.label]) {
                    result = itemImageFlatten(item_images_detail[swatch.label]);
                }
                else {
                    result = itemImageFlatten(item_images_detail);
                }

                if (result.length) {
                    result = _.sortBy(result, function (i) {
                        var option = i.url.split('-');
                        return isNaN(option[option.length - 1]) ? 1000 : parseInt(option[option.length - 1]);
                    });
                }

                return result.length ? result : [{
                    url: item.get('storedisplayimage') || application.Configuration.imageNotAvailable
                    , altimagetext: item.get('_name')
                }];
            },
            _thumbnail: function (item) {

                var item_images_detail = item.get('itemimages_detail') || {};
                var item_images_detail_parent = item.get('_matrixParent').get('itemimages_detail') || {};
                var selected_options = item.itemOptions,
                    swatch = selected_options && selected_options[application.getConfig('multiImageOption')] || null;

                var sImage;

                if (swatch && (item_images_detail[swatch.label] || item_images_detail_parent[swatch.label])) {

                    if (_.size(item_images_detail_parent)) {
                        sImage = itemImageFlatten(item_images_detail_parent[swatch.label])[0];
                    } else {
                        sImage = itemImageFlatten(item_images_detail[swatch.label])[0];
                    }
                    return sImage;
                }

                var currentView = application.getLayout().currentView;

                if(currentView) {
                    var translator = currentView.translator;
                    if (translator && translator.facets.length) {

                        swatch = application.getConfig('multiImageOptionFacet');

                        var selected_facet = _.findWhere(translator.facets, {id: swatch});
                        if (selected_facet && (item_images_detail[selected_facet.value] || item_images_detail_parent[selected_facet.value])) {

                            if (_.size(item_images_detail_parent)) {
                                sImage = itemImageFlatten(item_images_detail_parent[selected_facet.value])[0];
                            } else {
                                sImage = itemImageFlatten(item_images_detail[selected_facet.value])[0];
                            }
                            return sImage;
                        }
                    }
                }

                item_images_detail = item.get('_images') || {};

                // If you generate a thumbnail position in the itemimages_detail it will be used
                if (item_images_detail.thumbnail) {
                    return item_images_detail.thumbnail;
                }

                // otherwise it will try to use the storedisplaythumbnail
                if (SC.ENVIRONMENT.siteType && SC.ENVIRONMENT.siteType === 'STANDARD' && item.get('storedisplaythumbnail')) {
                    return {
                        url: item.get('storedisplaythumbnail')
                        , altimagetext: item.get('_name')
                    };
                }
                // No images huh? carry on

                var parent_item = item.get('_matrixParent');
                // If the item is a matrix child, it will return the thumbnail of the parent
                if (parent_item && parent_item.get('internalid')) {
                    return parent_item.get('_thumbnail');
                }

                var images = itemImageFlatten(item_images_detail);
                // If you using the advance images features it will grab the 1st one
                if (images.length) {
                    return images[0];
                }

                // still nothing? image the not available
                return {
                    url: application.Configuration.imageNotAvailable
                    , altimagetext: item.get('_name')
                };
            }
        });
    }

    }
});