/*jshint laxcomma:true*/
specs = [
	'tests/specs/app/modules/TransactionHistory/module'
];

require.config({
	paths: {
		'TransactionHistory.Model': 'js/src/app/modules/TransactionHistory/TransactionHistory.Model'
	}
,	shim: {
		'TransactionHistory.Model': {
			//deps: ['Invoice', 'CreditMemo', 'Deposit']
			exports: 'TransactionHistory.Model'
		}
	}
});

require(['underscore', 'jQuery', 'Main', 'Application', 'Utils']);

var SC = SC || {};


SC.ENVIRONMENT = SC.ENVIRONMENT || {
	siteSettings: {
		registration: {
			//companyfieldmandatory : 'T'
		}
	//,	checkout: {}
	}
,	PROFILE: {
		//isGuest: 'T'
	}
};
SC.templates = { 'transaction_history': 'a'};
