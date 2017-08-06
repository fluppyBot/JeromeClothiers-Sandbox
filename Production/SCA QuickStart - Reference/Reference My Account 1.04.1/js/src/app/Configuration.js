// Configuration.js
// ----------------
// All of the applications configurable defaults
// Each section is comented with a title, please continue reading
(function (application)
{
	'use strict';

	application.Configuration = {};

	_.extend(application.Configuration, {

		// header_macro will show an image with the url you set here
		logoUrl: ''

		// depending on the application we are configuring, used by the NavigationHelper.js
	,	currentTouchpoint: 'customercenter'

		// list of the applications required modules to be loaded
		// de dependencies to be loaded for each module are handled by
		// [require.js](http://requirejs.org/)
	,	modules: [
			// ItemDetails should always be the 1st to be added
			// there will be routing problmes if you change it
			['ItemDetails',  {startRouter: false}]
		,	'Profile' // must be before Cart
		,	['Cart', {startRouter: false}]
		,	['Address' , {startRouter: SC.ENVIRONMENT.siteSettings.is_logged_in}]
		,	'Content'
		,	['CreditCard', {startRouter: SC.ENVIRONMENT.siteSettings.is_logged_in}]
		,	'BackToTop'
		,	'Facets.Model'
		,	'LanguageSupport'
		,	'MultiCurrencySupport'
		,	'MultiHostSupport'
		,	'OrderHistory'
		,	'ReturnAuthorization'
		,	'OrderItem'
		,	'GoogleAnalytics'
		,	'GoogleUniversalAnalytics'
		,	'Receipt'
		,	'NavigationHelper'
		,	'Responsive'
		,	'SiteSearch'
		,	'AjaxRequestsKiller'
		,	'ErrorManagement'
		,	'Merchandising'
		,	'Balance'

		,	'Invoice'
		,	'CreditMemo'
		,	'Deposit'
		,	'DepositApplication'
		,	'CustomerPayment'
		,	'LivePayment'
		,	'PaymentWizard'
		,	'TransactionHistory'
		,	'ProductList'
		,	'PrintStatement'
		,	'Quote'

		,	'Case'
		]

	,	paymentWizardSteps: [
			{
				name: _('SELECT INVOICES TO PAY').translate()
			,	steps: [{
					url: 'make-a-payment'
				,	hideBackButton: true
				,	hideContinueButton: true
				,	modules: [
						'PaymentWizard.Module.Invoice'
					,	['PaymentWizard.Module.Summary', { container: '#wizard-step-content-right', show_estimated_as_invoices_total: true }]
					]
				,	save: function ()
					{
						return jQuery.Deferred().resolve();
					}
				}]
			}
		,	{
				name: _('PAYMENT REVIEW').translate()
			,	steps: [{
					url: 'review-payment'
				,	hideBackButton: true
				,	hideContinueButton: true
				,	modules: [
						'PaymentWizard.Module.ShowInvoices'
					,	['PaymentWizard.Module.CreditTransaction', {transaction_type: 'deposit'}]
					,	['PaymentWizard.Module.CreditTransaction', {transaction_type: 'credit'}]
					,	'PaymentWizard.Module.ShowTotal'
					,	['PaymentWizard.Module.PaymentMethod.Creditcard', {title: _('Credit Card').translate()}]
					,	['PaymentWizard.Module.Addresses', {title: _('Billing Address').translate()}]
					,	['PaymentWizard.Module.Summary', { container: '#wizard-step-content-right', total_label: _('Payment Total').translate(), submit: true }]
					]
				,	save: function ()
					{
						return this.wizard.model.save();
					}
				}]
			}
		,	{
				name: _('Payment Confirmation').translate()
			,	steps: [{
					url: 'payment-confirmation'
				,	hideBackButton: true
				,	hideBreadcrumb: true
				,	hideContinueButton: true
				,	modules: [
						'PaymentWizard.Module.Confirmation'
					,	'PaymentWizard.Module.ShowInvoices'
					,	['PaymentWizard.Module.ShowCreditTransaction', {transaction_type: 'deposit'}]
					,	['PaymentWizard.Module.ShowCreditTransaction', {transaction_type: 'credit'}]
					,	'PaymentWizard.Module.ShowTotal'
					,	'PaymentWizard.Module.ShowPayments'
					,	['PaymentWizard.Module.ConfirmationNavigation', { container: '#wizard-step-content-right', submit: true }]
					]
				}]
			}
		]

		// Whats your Customer support url
	,	customerSupportURL: ''

		// default macros
	,	macros: {

			itemOptions: {
				// each apply to specific item option types
				selectorByType:
				{
					select: 'itemDetailsOptionTile'
				,	'default': 'itemDetailsOptionText'
				}
				// for rendering selected options in the shopping cart
			,	selectedByType: {
					'default': 'shoppingCartOptionDefault'
				}
			}
			// default merchandising zone template
		,	merchandisingZone: 'merchandisingZone'
		}

		// Whats your return policy url.
		// If this is set to some value, a link to "Return Items" will appear on order details
		// eg: returnPolicyURL: '/s.nl/sc.5/.f'
	,	returnPolicyURL: ''

		// If you configure an object here it will display it in the index of my account
		// Ideal for promotions for clients
	,	homeBanners: [
			// {
			//	imageSource: "img/banner1.jpeg",
			//	linkUrl: "",
			//	linkTarget: ""
			// }
		]

		// Default url for the item list in the home touchpoint
	,	defaultSearchUrl: 'search'

		// Search preferences
	,	searchPrefs: {
			// keyword maximum string length - user won't be able to write more than 'maxLength' chars in the search box
			maxLength: 40

			// keyword formatter function will format the text entered by the user in the search box. This default implementation will remove invalid keyword characters like *()+-="
		,	keywordsFormatter: function (keywords)
			{
					// characters that cannot appear at any location
				var anyLocationRegex = /[\(\)\[\]\{\}\!\"\:]{1}/g
					// characters that cannot appear at the begining
				,	beginingRegex = /^[\*\-\+\~]{1}/g
					// replacement for invalid chars
				,	replaceWith = '';

				return keywords.replace(anyLocationRegex, replaceWith).replace(beginingRegex, replaceWith);
			}
		}

		// array of links to be added to the header
		// this can also contain subcategories
	,	navigationTabs: [
			{
				text: _('Home').translate()
			,	href: '/'
			,	data: {
					touchpoint: 'home'
				,	hashtag: '#/'
				}
			}
		,	{
				text: _('Shop').translate()
			,	href: '/search'
			,	data: {
					touchpoint: 'home'
				,	hashtag: '#/search'
				}
			}
		]

		// options to be passed when querying the Search API
	,	searchApiMasterOptions: {
			Facets: {
				fieldset: 'search'
			}

		,	typeAhead: {
				fieldset: 'typeahead'
			}
		}

		// Analytics Settings
		// You need to set up both popertyID and domainName to make the default trackers work
	,	tracking: {
			// [Google Universal Analytics](https://developers.google.com/analytics/devguides/collection/analyticsjs/)
			googleUniversalAnalytics: {
				propertyID: ''
			,	domainName: ''
			}
			// [Google Analytics](https://developers.google.com/analytics/devguides/collection/gajs/)
		,	google: {
				propertyID: ''
			,	domainName: ''
			}
		}

		// Typeahead Settings
	,	typeahead: {
			minLength: 3
		,	maxResults: 8
		,	macro: 'typeahead'
		,	sort: 'relevance:asc'
		}

		// setting it to false will search in the current results
		// if on facet list page
	,	isSearchGlobal: true

		// url for the not available image
	,	imageNotAvailable: _.getAbsoluteUrl('img/no_image_available.jpeg')

		// map of image custom image sizes
		// usefull to be customized for smaller screens
	,	imageSizeMapping: {
			thumbnail: 'thumbnail' // 175 * 175
		,	main: 'main' // 600 * 600
		,	tinythumb: 'tinythumb' // 50 * 50
		,	zoom: 'zoom' // 1200 * 1200
		,	fullscreen: 'fullscreen' // 1600 * 1600
		}

		// Macro to be rendered in the header showing your name and nav links
		// we provide be 'headerProfile' or 'headerSimpleProfile'
	,	profileMacro: 'headerProfile'

	,	languagesEnabled: true

		// Which template to render for the home view
		// We provide "home_tmpl" and "home_alt_tmpl"
	,	homeTemplate: 'home_tmpl'

		// When showing your credit cards, which icons should we use
	,	creditCardIcons: {
			'VISA': 'img/visa.png'
		,	'Discover': 'img/discover.png'
		,	'Master Card': 'img/master.png'
		,	'Maestro': 'img/maestro.png'
		,	'American Express': 'img/american.png'
		}

		// This object will be merged with specific pagination settings for each of the pagination calls
		// You can use it here to toggle settings for all pagination components
		// For information on the valid options check the pagination_macro.txt
	,	defaultPaginationSettings: {
			showPageList: true
		,	pagesToShow: 9
		,	showPageIndicator: false
		}

	,	facetDelimiters: {
			betweenFacetNameAndValue: '/'
		,	betweenDifferentFacets: '/'
		,	betweenDifferentFacetsValues: ','
		,	betweenRangeFacetsValues: 'to'
		,	betweenFacetsAndOptions: '?'
		,	betweenOptionNameAndValue: '='
		,	betweenDifferentOptions: '&'
		}
		// Output example: /brand/GT/style/Race,Street?display=table

		// eg: a different set of delimiters
		/*
		,	facetDelimiters: {
			,	betweenFacetNameAndValue: '-'
			,	betweenDifferentFacets: '/'
			,	betweenDifferentFacetsValues: '|'
			,	betweenRangeFacetsValues: '>'
			,	betweenFacetsAndOptions: '~'
			,	betweenOptionNameAndValue: '/'
			,	betweenDifferentOptions: '/'
		}
		*/
		// Output example: brand-GT/style-Race|Street~display/table

	,	collapseElements: false
	,	notShowCurrencySelector: true
	,	filterRangeQuantityDays: 30
	,	productReviews: {
			maxRate: 5
		}

		// Return Authorization configuration
	,	returnAuthorization: {

			reasons: [
				_('Wrong Item Shipped').translate()
			,	_('Did not fit').translate()
			,	_('Quality did not meet my standards').translate()
			,	_('Not as pictured on the Website').translate()
			,	_('Damaged during shipping').translate()
			,	_('Changed my mind').translate()
			,	_('Item was defective').translate()
			,	_('Arrived too late').translate()
			]
		}
	});

	// window.screen = false;
	// Calculates the width of the device, it will try to use the real screen size.
	var screen_width = (window.screen) ? window.screen.availWidth : window.outerWidth || window.innerWidth;

	// Phone Specific
	if (screen_width < 768)
	{
		_.extend(application.Configuration, {
			defaultPaginationSettings: {
				showPageList: false
			,	showPageIndicator: true
			}
		,	collapseElements: true
		});
	}
	// Tablet Specific
	else if (screen_width >= 768 && screen_width <= 1024)
	{
		_.extend(application.Configuration, {
			defaultPaginationSettings: {
				showPageList: true
			,	pagesToShow: 4
			,	showPageIndicator: false
			}
		});
	}
	// Desktop Specific
	else
	{
		_.extend(application.Configuration, {});
	}

})(SC.Application('MyAccount'));
