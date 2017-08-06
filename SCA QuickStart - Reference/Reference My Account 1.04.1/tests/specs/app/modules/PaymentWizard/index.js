/*jshint laxcomma:true*/
specs = [
	'tests/specs/app/modules/PaymentWizard/CreditCards'
,	'tests/specs/app/modules/PaymentWizard/editAmount.view'
,	'tests/specs/app/modules/PaymentWizard/module.Invoice'
,	'tests/specs/app/modules/PaymentWizard/module.Summary'
,	'tests/specs/app/modules/PaymentWizard/module'
];

require.config({
	paths: {
		'Payment.Model': 'js/src/app/modules/Payment/Payment.Model'
	,	'Invoice': 'js/src/app/modules/Invoice/Invoice'
	,	'CreditMemo': 'js/src/app/modules/CreditMemo/CreditMemo'
	,	'CreditMemo.Model': 'js/src/app/modules/CreditMemo/CreditMemo.Model'
	,	'CreditMemo.Collection': 'js/src/app/modules/CreditMemo/CreditMemo.Collection'
	,	'Deposit': 'js/src/app/modules/Deposit/Deposit'
	,	'Deposit.Model': 'js/src/app/modules/Deposit/Deposit.Model'
	,	'Deposit.Collection': 'js/src/app/modules/Deposit/Deposit.Collection'
	,	'PaymentWizard.Module.PaymentMethod.Creditcard': 'js/src/app/modules/PaymentWizard/PaymentWizard.Module.PaymentMethod.Creditcard'
	,	'CreditCard.Views': 'js/src/app/modules/CreditCard/CreditCard.Views'
	,	'PaymentWizard': 'js/src/app/modules/PaymentWizard/PaymentWizard'
	,	'PaymentWizard.Module.Summary':'js/src/app/modules/PaymentWizard/PaymentWizard.Module.Summary'
	,	'PaymentWizard.Module.Addresses': 'js/src/app/modules/PaymentWizard/PaymentWizard.Module.Addresses'
	,	'PaymentWizard.Module.Confirmation':'js/src/app/modules/PaymentWizard/PaymentWizard.Module.Confirmation'
	,	'OrderWizard.Module.Address.Billing':'js/src/app/modules/OrderWizard/OrderWizard.Module.Address.Billing'
	,	'OrderWizard.Module.Address': 'js/src/app/modules/OrderWizard/OrderWizard.Module.Address'
	,	'Address.Views': 'js/src/app/modules/Address/Address.Views'
	,	'CreditCard.Collection':'js/src/app/modules/CreditCard/CreditCard.Collection'
	,	'PaymentWizard.Module.CreditTransaction':'js/src/app/modules/PaymentWizard/PaymentWizard.Module.CreditTransaction'
	}
,	shim: {
		'Payment.Model': {
			deps: ['Invoice', 'CreditMemo', 'Deposit']
		,	exports: 'Payment.Model'
		}
	,	'PaymentWizard': {
			deps:[
					'PaymentWizard.Module.Summary'
				,	'PaymentWizard.Module.Addresses'
				,	'PaymentWizard.Module.Confirmation'
				,	'PaymentWizard.Module.CreditTransaction'
			]
		,	exports: 'PaymentWizard'
		}
	,	'PaymentWizard.Module.Addresses': {
			deps:['OrderWizard.Module.Address.Billing','OrderWizard.Module.Address']
		,	exports: 'PaymentWizard.Module.Addresses'
		}
	,	'OrderWizard.Module.Address': {
			deps: ['Address.Views']
		,	exports: 'OrderWizard.Module.Address'
		}
	}
});

require(['underscore', 'jQuery', 'Main', 'Application', 'Utils']);

var SC = SC || {};

require(['BigNumber'], function (BigNumber) {
	window.BigNumber = BigNumber;
});

SC.ENVIRONMENT = SC.ENVIRONMENT || {
	siteSettings: {
		registration: {
			companyfieldmandatory : 'T'
		}
	,	checkout: {}
	}
,	PROFILE: {
		isGuest: 'T'
	}
};
SC.templates = { 'payment_wizard_paymentmethod_creditcard_module_tmpl': 'a'};
