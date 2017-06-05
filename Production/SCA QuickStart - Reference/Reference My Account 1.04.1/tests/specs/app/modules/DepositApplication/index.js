/*jshint laxcomma:true*/
SC = {
	ENVIRONMENT: {}
};

specs = [
	'tests/specs/app/modules/DepositApplication/module'
,	'tests/specs/app/modules/DepositApplication/model'
,	'tests/specs/app/modules/DepositApplication/views'
];

require.config({
	paths: {
		DepositApplication: 'js/src/app/modules/DepositApplication/DepositApplication'
	}
});

require(['underscore', 'jQuery', 'Main', 'ApplicationSkeleton']);