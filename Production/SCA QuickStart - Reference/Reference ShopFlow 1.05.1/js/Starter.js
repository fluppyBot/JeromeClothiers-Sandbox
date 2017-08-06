SC.startShopping = function ()
{
	'use strict'; 

	var application = SC.Application('Shopping');

	application.getConfig().siteSettings = SC.ENVIRONMENT.siteSettings || {};

	/*
	SC.initializeUserEnvironment(application); 
	application.getUserPromise().done(function() //this is the first promise listener so it will be the first one to be notified.
	{
		SC.initializeUserEnvironment(application);
	});
	*/
	
	// The page generator needs to run in sync in order to work properly
	if (SC.ENVIRONMENT.jsEnvironment !== 'browser')
	{
		jQuery.ajaxSetup({ async: false });
	}
		
	SC.compileMacros(SC.templates.macros);

	// Requires all dependencies so they are bootstrapped
	require(['Content.DataModels', 'Merchandising.Rule'], function (ContentDataModels, MerchandisingRule)
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
		
		// When the document is ready we call the application.start, and once that's done we bootstrap and start backbone
		application.start(function ()
		{
			////////////////////////////
			// Bootstrap some objects //
			////////////////////////////
			

			// Checks for errors in the context
			if (SC.ENVIRONMENT.contextError)
			{
				// Hide the header and footer.
				application.getLayout().$('#site-header').hide();
				application.getLayout().$('#site-footer').hide();
				
				// Shows the error.
				application.getLayout().internalError(SC.ENVIRONMENT.contextError.errorMessage,'Error ' + SC.ENVIRONMENT.contextError.errorStatusCode + ': ' + SC.ENVIRONMENT.contextError.errorCode);
			}
			else
			{
				var fragment = _.parseUrlOptions(location.search).fragment;
			
				if (fragment && !location.hash)
				{
					location.hash = decodeURIComponent(fragment);
				}

				// OSnly do push state client side.
				Backbone.history.start({
					pushState: SC.ENVIRONMENT.seoSupport && SC.ENVIRONMENT.jsEnvironment === 'browser'
				});
			}
		});
	});
	// remove the script added for load script function
	// only if the javascript environment is the seo server
	if (SC.ENVIRONMENT.jsEnvironment === 'server')
	{
		jQuery('.seo-remove').remove();
	}	
};


	

SC.startShopping();

jQuery(function() 
{
	'use strict'; 

	SC.Application('Shopping').getLayout().appendToDom();
});
