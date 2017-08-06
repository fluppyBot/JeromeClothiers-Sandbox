/*jshint laxcomma:true*/
SC.sessioncheck = function(){
	self = this;
	console.log('hastimedout');
	jQuery.ajax({
		url: 'https://jerome.securedcheckout.com/c.3857857/myaccount/services/live-order.ss'
	});
	setTimeout(function(){
		SC.sessioncheck();
	}, 1140000);
}

jQuery(document).ready(function ()
{
	'use strict';

	SC.compileMacros(SC.templates.macros);

	var application = SC.Application('Checkout');

	application.getConfig().siteSettings = SC.ENVIRONMENT.siteSettings || {};

	require(['Merchandising.Rule', 'Content.DataModels', 'Categories'], function (MerchandisingRule, ContentDataModels, Categories)
	{
		// Loads the urls of the different pages in the conten service,
		// this needs to happend before the app starts, so some routes are registered
		if (SC.ENVIRONMENT.CONTENT)
		{
			ContentDataModels.Urls.Collection.getInstance().reset(SC.ENVIRONMENT.CONTENT);
			delete SC.ENVIRONMENT.CONTENT;

			if (SC.ENVIRONMENT.DEFAULT_PAGE)
			{
				ContentDataModels.Pages.Collection.getInstance().reset(SC.ENVIRONMENT.DEFAULT_PAGE);
				delete SC.ENVIRONMENT.DEFAULT_PAGE;
			}
		}

		if (SC.ENVIRONMENT.MERCHANDISING)
		{
			// we need to turn it into an array
			var definitions = _.map(SC.ENVIRONMENT.MERCHANDISING, function (value, key)
			{
				value.internalid = key;
				return value;
			});

			MerchandisingRule.Collection.getInstance().reset(definitions);
			delete SC.ENVIRONMENT.MERCHANDISING;
		}

		if (SC.ENVIRONMENT.checkout_skip_login)
		{
			application.Configuration.checkout_skip_login = SC.ENVIRONMENT.checkout_skip_login;
			delete SC.ENVIRONMENT.checkout_skip_login;
		}

        if (SC.ENVIRONMENT.CATEGORIES)
        {
            Categories.reset(SC.ENVIRONMENT.CATEGORIES);
        }

        application.initGlobals(SC.ENVIRONMENT.GLOBALS);

		jQuery(application.start (function ()
		{
			if (SC.ENVIRONMENT.CART)
			{
				application.getCart().set(SC.ENVIRONMENT.CART);
				delete SC.ENVIRONMENT.CART;
			}

			application.getUser().set(SC.ENVIRONMENT.PROFILE);

			if (SC.ENVIRONMENT.ADDRESS)
			{
				application.getUser().get('addresses').reset(SC.ENVIRONMENT.ADDRESS);
				delete SC.ENVIRONMENT.ADDRESS;
			}
			else
			{
				application.getUser().get('addresses').reset([]);
			}

			if (SC.ENVIRONMENT.CREDITCARD)
			{
				application.getUser().get('creditcards').reset(SC.ENVIRONMENT.CREDITCARD);
				delete SC.ENVIRONMENT.CREDITCARD;
			}
			else
			{
				application.getUser().get('creditcards').reset([]);
			}

			// Checks for errors in the context
			if(SC.ENVIRONMENT.contextError)
			{
				// Shows the error.
				if (SC.ENVIRONMENT.contextError.errorCode === 'ERR_WS_EXPIRED_LINK')
				{
					application.getLayout().expiredLink(SC.ENVIRONMENT.contextError.errorMessage);
				}
				else
				{
					application.getLayout().internalError(SC.ENVIRONMENT.contextError.errorMessage, 'Error ' + SC.ENVIRONMENT.contextError.errorStatusCode + ': ' + SC.ENVIRONMENT.contextError.errorCode);
				}
			}
			else
			{
				var fragment = _.parseUrlOptions(location.search).fragment;

				// if (fragment && application.getConfig('currentTouchpoint') !== 'login' && !location.hash)
				// TODO, PB: why shoudln't we change the hash on login?
				if (fragment && !location.hash)
				{
					location.hash = decodeURIComponent(fragment);
				}

				Backbone.history.start();
			}

			if (SC.ENVIRONMENT.siteSettings.sitetype === 'STANDARD' && SC.ENVIRONMENT.siteSettings.showcookieconsentbanner === 'T')
			{
				//if cookie consent banner is going to be displayed, fix the navigation issue
				_.preventAnchorNavigation('div#cookieconsent a');
			}
			application.getLayout().appendToDom();
			SC.sessioncheck();
		}));
	});
});
