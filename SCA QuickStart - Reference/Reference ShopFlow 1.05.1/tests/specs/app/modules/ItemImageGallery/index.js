/* jshint laxcomma: true */
SC = {
	ENVIRONMENT: {
		jsEnvironment: 'browser'
	}
,	macros: {
		// itemDetailsImage: 'itemDetailsImage'
	}
};

specs = [
	'tests/specs/app/modules/ItemImageGallery/module'
];

require.config({
	paths: {
		ItemImageGallery: 'js/src/app/modules/ItemImageGallery/ItemImageGallery'
	}
});

require(['underscore', 'jQuery', 'Main', 'ApplicationSkeleton']);