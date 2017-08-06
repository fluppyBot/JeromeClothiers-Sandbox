/*jshint laxcomma:true*/
SC = {
	ENVIRONMENT: {
		siteSettings:{
			siteid: 2
		,	registration : {
				companyfieldmandatory: 'F'
			}
		}
	}
};

specs = [
	'tests/specs/app/modules/Deposit/module'
,	'tests/specs/app/modules/Deposit/model'
,	'tests/specs/app/modules/Deposit/views'
];

require.config({
	paths: {
		Deposit: 'js/src/app/modules/Deposit/Deposit'
	}
});

require(['underscore', 'jQuery', 'Main', 'ApplicationSkeleton']);