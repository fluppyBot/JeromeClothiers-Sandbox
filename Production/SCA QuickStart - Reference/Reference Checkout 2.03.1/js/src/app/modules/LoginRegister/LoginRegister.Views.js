// LoginRegister.Views.js
// ----------------------
// Handles the form saving
define('LoginRegister.Views'
,	[
		'Account.Login.Model'
	,	'Account.Register.Model'
	,	'Account.RegisterAsGuest.Model'
	,	'Account.ForgotPassword.Model'
	,	'Account.ResetPassword.Model'
	,	'ErrorManagement'
	,	'Session'
	]
,	function (
		AccountLoginModel
	,	AccountRegisterModel
	,	AccountRegisterAsGuestModel
	,	AccountForgotPasswordModel
	,	AccountResetPasswordModel
	,	ErrorManagement
	,	Session
	)
{
	'use strict';

	// We override the default behaviour of the save form for all views
	// to add an error handler using the ErrorManagement module
	var customSaveForm = function (e)
	{
		e.preventDefault();
		
		var	self = this
		,	promise = Backbone.View.prototype.saveForm.apply(this, arguments);

		promise && promise.error(function (jqXhr)
		{
			jqXhr.preventDefault = true;
			var message = ErrorManagement.parseErrorMessage(jqXhr, self.options.application.getLayout().errorMessageKeys);
			self.showError(message);
		});
	};

	var skipLoginCloseModal = function ()
	{
		if (this.$containerModal && this.options.application.getConfig('checkout_skip_login'))
		{
			this.$containerModal.modal('hide'); 
		}
	}; 

	var Views = {};

	Views.Login = Backbone.View.extend({

		template: 'login'

	,	attributes: {
			'id': 'login-view'
		,	'class': 'view login-view'
		}
		
	,	events: {
			'submit form': 'saveForm'
		,	'click [data-type="register-now"]': 'skipLoginCloseModal'
		,	'click [data-type="forgot-password"]': 'skipLoginCloseModal'
		}

	,	initialize: function ()
		{
			this.model = new AccountLoginModel();
			// on save we reidrect the user out of the login page
			// as we know there hasn't been an error
			this.model.on('save', _.bind(this.redirect, this));
		}

	,	saveForm: customSaveForm

	,	skipLoginCloseModal: skipLoginCloseModal

	,	render: function()
		{
			Backbone.View.prototype.render.apply(this, arguments); 
			if (this.$containerModal && this.options.application.getConfig('checkout_skip_login'))
			{
				this.$('.sign-in-actions').append('<br/><br/><br/><div class="pull-left">'+_('Want to create an Account first?').translate()+
					'<a class="btn-link" href="register" data-toggle="show-in-modal" data-type="register-now">'+_('Register Now').translate()+'</a></div>'); 
				this.$('[data-type="forgot-password"]').attr('data-toggle', 'show-in-modal');
			}
		}

	,	trackEvent: function (callback)
		{
			this.options.application.trackEvent({
				category: 'login'
			,	action: 'click'
			,	value: 1
			,	callback: callback
			});
		}

	,	redirect: function (context, response)
		{
			var url_options = _.parseUrlOptions(window.location.search)
			,	touchpoints = response.touchpoints
			,	self = this;

			// Track Login Event
			this.trackEvent(function ()
			{

				if (url_options.is === 'checkout' || url_options.origin === 'checkout') 
				{
					self.refreshApplication(response); 
				}
				else 
				{
					// if we know from which touchpoint the user is coming from
					if (url_options.origin && touchpoints[url_options.origin])
					{
						// we save the url to that touchpoint
						var url = touchpoints[url_options.origin];
						// if there is an specific hash
						if (url_options.origin_hash)
						{
							// we add it to the url as a fragment
							url = _.addParamsToUrl(url, {fragment: url_options.origin_hash});
						}

						window.location.href = url;
					}
					else
					{
						// otherwise we need to take it to the customer center
						window.location.href = touchpoints.customercenter;
					}
				}
			});
		}

		// login and checkout are unified in the same ssp so after user logs in we want to refresh the UI without having to refresh the entire
		// Remember that the new user can be associated to other language/currency so we must refresh all the app. 
		// The easy and safer way would be refreshing the page.
	,	refreshApplication: function (response)
		{
			var current_language = Session.get('language.locale');
			if (response.language && response.language.locale && current_language !== response.language.locale) 
			{
				// TODO: we could load the language file dynamically and re-render the page without relaoding but we notice some issues 
				// regarding non translated strings (like continueButtonLabel that are defined in the configuration and store as views attributes). 
				// Since we need a better application-refresh logic for solving this we just reload the page if the language changed. 
				window.location.href = response.touchpoints.checkout; 
			}
			else
			{		
				response.user && this.options.application.getUser().set(response.user);
				response.cart && this.options.application.getCart().set(response.cart);
				response.address && this.options.application.getUser().get('addresses').reset(response.address);
				response.creditcard && this.options.application.getUser().get('creditcards').reset(response.creditcard);
				response.currency && response.currency.code && Session.set('currency', response.currency);
				response.touchpoints && (this.options.application.Configuration.siteSettings.touchpoints = response.touchpoints);
				// TODO PriceLevel?
				this.options.application.Configuration.currentTouchpoint = 'checkout';
				Backbone.history.navigate('', { trigger: true });
			}
		}
	});

	Views.Register = Backbone.View.extend({

		template: 'register'

	,	attributes: {
			'id': 'register-view'
		,	'class': 'view register-view'
		}
		
	,	events: {
			'submit form': 'saveForm'
		}

	,	initialize: function ()
		{
			this.model = new AccountRegisterModel();
			// on save we reidrect the user out of the registration page
			// as we know there hasn't been an error
			this.model.on('save', _.bind(this.redirect, this));
		}

	,	saveForm: customSaveForm

	,	trackEvent: function (callback)
		{
			this.options.application.trackEvent({
				category: 'new-account'
			,	action: 'click'
			,	value: 1
			,	callback: callback
			});
		}

	,	redirect: function (context, response)
		{
			var url_options = _.parseUrlOptions(window.location.search)
			,	touchpoints = response.touchpoints;

			if (url_options.is && url_options.is === 'checkout') 
			{
				response.user && this.options.application.getUser().set(response.user);
				response.cart && this.options.application.getCart().set(response.cart);
				response.address && this.options.application.getUser().get('addresses').reset(response.address);
				response.creditcard && this.options.application.getUser().get('creditcards').reset(response.creditcard);

				var self = this;
				// Track Guest Checkout Event
				this.trackEvent(function ()
				{
					self.options.application.Configuration.currentTouchpoint = 'checkout';
					Backbone.history.navigate('', { trigger: true });
				});
			}
			else 
			{
				// Track Login Event
				this.trackEvent(function ()
				{
					// if we know from which touchpoint the user is coming from
					if (url_options.origin && touchpoints[url_options.origin])
					{
						// we save the url to that touchpoint
						var url = touchpoints[url_options.origin];
						// if there is an specific hash
						if (url_options.origin_hash)
						{
							// we add it to the url as a fragment
							url = _.addParamsToUrl(url, {fragment: url_options.origin_hash});
						}

						window.location.href = url;
					}
					else
					{
						// otherwise we need to take it to the customer center
						window.location.href = touchpoints.customercenter;
					}
				});
			}
		}
	});

	Views.CheckoutAsGuest = Backbone.View.extend({

		template: 'checkout_as_guest'

	,	attributes: {
			'id': 'checkout-as-guest'
		,	'class': 'view checkout-as-guest'
		}

	,	events: {
			'submit form': 'saveForm'
		}

	,	saveForm: customSaveForm

	,	initialize: function ()
		{
			this.model = new AccountRegisterAsGuestModel();
			// on save we reidrect the user out of the registration page
			// as we know there hasn't been an error
			this.model.on('save', _.bind(this.redirect, this));
		}

	,	trackEvent: function (callback)
		{
			this.options.application.trackEvent({
				category: 'guest-checkout'
			,	action: 'click'
			,	value: 1
			,	callback: callback
			});
		}

	,	redirect: function (context, response)
		{
			this.$('[type="submit"]').attr('disabled', true);
			
			response.user && this.options.application.getUser().set(response.user);
			response.cart && this.options.application.getCart().set(response.cart);
			response.address && this.options.application.getUser().get('addresses').reset(response.address);
			response.creditcard && this.options.application.getUser().get('creditcards').reset(response.creditcard);

			var self = this;
			// Track Guest Checkout Event
			this.trackEvent(function ()
			{
				self.options.application.Configuration.currentTouchpoint = 'checkout';
				Backbone.history.navigate('', { trigger: true });
			});
		}
	});

	Views.LoginRegister = Backbone.View.extend({

		template: 'login_register'

	,	title: _('Sign In | Register').translate()

	,	attributes: {
			'id': 'login-register'
		,	'class': 'view login-register'
		}

	,	events: {
			// login error message could contain link to registration page
			'click .alert-error a': 'handleErrorLink'
		}

	,	initialize: function (options)
		{
			var application = options.application
				// To distinguish between when the login is called from the Register header link or the Proced to Checkout link, we use the origin url param (is_checking_out)
				// origin=checkout when the checkout link is clicked so we show the guest checkout button.
			,	parameters = _.parseUrlOptions(location.search)
			,	is_checking_out = (parameters && parameters.is === 'checkout') || (parameters && parameters.origin === 'checkout') || false;
			
			this.pageTitle = _('Sign In').translate();

			// On the LoginRegister view we initialize all of the views
			this.sub_views = {
				Login: new Views.Login({application: application})
			,	Register: new Views.Register({application: application})
			,	CheckoutAsGuest: new Views.CheckoutAsGuest({application: application})
			};

			this.enableRegister = application.getConfig('siteSettings.loginrequired') === 'F' && application.getConfig('siteSettings.registration.registrationallowed') === 'T';

			// we only show the CheckoutAsGuest button in 'checkout' touchpoint. Never in login/register touchpoints.
			this.enableCheckoutAsGuest = is_checking_out && this.enableRegister && application.getUser().get('isLoggedIn') === 'F' &&
				application.getConfig('siteSettings.registration.registrationoptional') === 'T'; 
		}

	,	handleErrorLink: function (e)
		{
			// if the link contains the register touchpoint
			if (~e.target.href.indexOf(this.options.application.getConfig('siteSettings.touchpoints.register')))
			{
				e.preventDefault();
				this.showRegistrationForm();
				this.sub_views.Login.hideError();
			}
		}

	,	showRegistrationForm: function ()
		{
			// show the form
			this.sub_views.Register.$el.closest('.collapse').addClass('in');
			// hide the conatiner of the link to show it
			this.sub_views.CheckoutAsGuest.$('.collapse.register').removeClass('in');
		}

	,	render: function()
		{
			var result = this._render()
			,	self = this;

			// on render we render all of the sub views
			_.each(this.sub_views, function (sub_view, key)
			{
				sub_view.render();
				self.$('[data-placeholder="' + key + '"]').append(sub_view.$el);
			});

			return result;
		}
	});

	Views.ForgotPassword = Backbone.View.extend({

		template: 'forgot_password'		

	,	title: _('Reset Password').translate()

	,	events: {
			'submit form': 'saveForm'
		,	'click [data-type="sign-in-now"]': 'signInNowClick'
		}

	,	render: function ()
		{
			Backbone.View.prototype.render.apply(this, arguments); 
			if (this.$containerModal && this.options.application.getConfig('checkout_skip_login'))
			{
				this.$('header, h3').remove();
				this.$('[data-type="sign-in-now"]').attr({'data-toggle': 'show-in-modal', 'href': 'login'}); 
			}
		}

	,	initialize: function ()
		{
			this.model = new AccountForgotPasswordModel();
			this.model.on('save', _.bind(this.showSuccess, this));
		}

	,	showSuccess: function()
		{
			this.$('form').empty().html(
				SC.macros.message(
					_('We sent an email with instructions on how to reset your password to <b>$(0)</b>').translate(this.model.get('email'))
				,	'success'
				)
			);
		}

	,	signInNowClick: skipLoginCloseModal

	,	saveForm: function ()
		{
			// we don't want to close the modal, if any, on saveForm
			if (this.$containerModal && this.options.application.getConfig('checkout_skip_login'))
			{
				this.inModal = false;
			}
			return Backbone.View.prototype.saveForm.apply(this, arguments).done(function ()
			{
				this.inModal = true;
			}); 
		}
	});

	Views.ResetPassword = Backbone.View.extend({

		template: 'reset_password'

	,	title: _('Reset Password').translate()

	,	events: {
			'submit form': 'saveForm'
		}

	,	initialize: function ()
		{
			// TODO: refactor _.parseUrlOptions(location.search)
			this.model = new AccountResetPasswordModel();
			this.email = unescape(_.parseUrlOptions(location.search).e);
			this.model.set('params', {'e':this.email, 'dt':_.parseUrlOptions(location.search).dt, 'cb':_.parseUrlOptions(location.search).cb});
			this.model.on('save', _.bind(this.showSuccess, this));
		}

	,	showSuccess: function()
		{
			this.$('form').empty().html(
				SC.macros.message(
					_('Your password has been reset.').translate()
				,	'success'
				)
			);
		}
	});

	return Views;
});