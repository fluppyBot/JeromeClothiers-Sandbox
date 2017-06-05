/*jshint laxcomma:true*/
specs = [
	'tests/specs/app/modules/PrintStatement/module'
];

require.config({
	paths: {

	}
,	shim: {

	}
});

require(['underscore', 'jQuery', 'Main', 'Application', 'Utils']);

var SC = SC || {
	templates: {macros: {}}
,	ENVIRONMENT:{
		siteSettings:{}
	}
};
