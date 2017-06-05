/*jshint laxcomma:true*/
SC = {
	ENVIRONMENT: {}
};

specs = [
	'tests/specs/app/modules/Invoice/module'
,	'tests/specs/app/modules/Invoice/collection'
,	'tests/specs/app/modules/Invoice/details.view'
,	'tests/specs/app/modules/Invoice/model'
,	'tests/specs/app/modules/Invoice/openlist.view'
,	'tests/specs/app/modules/Invoice/paidlist.view'
];

require.config({
	paths: {
		Invoice: 'js/src/app/modules/Invoice/Invoice'
	}
});

require(['underscore', 'jQuery', 'Main', 'ApplicationSkeleton']);