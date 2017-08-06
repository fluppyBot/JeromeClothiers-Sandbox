/*global _:false, runs:false, waitsFor:false, require:false, beforeEach: false, SC:false, Backbone:false, define:false, jQuery:false, jasmine:false */
/*jshint forin:true, evil:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, browser:true, quotmark:single, maxerr:50, laxcomma:true, expr:true*/

define(['jasmineAjax', 'Application', 'jasmineTypeCheck'],
	function ()
{
	'use strict';

	return (function ()
	{
		var helper = function (options)
		{
			var self = this;
			this.is_started = false;
			this.layout;
			this.initialization_completed = false;
			this.options = options || {};

			this.application = SC.Application(this.options.applicationName || 'testApplication');

			//Mock require configuration
			this.application.Configuration = this.options.applicationConfiguration || {};

			//Download and compile all templates and macros
			jQuery.ajax({ url: '../../../../../templates/Templates.php', async: false}).
				done(function (data)
					{
						eval(data);
						SC.compileMacros(SC.templates.macros);

						if (self.options.requireModules)
						{
							require(self.options.requireModules, function ()
							{
								self.initialization_completed = true;
								self._insternalLoadCompleted();
							});
						}else {
							self.initialization_completed = true;
						}
					});
		};

		helper.prototype._insternalLoadCompleted = function ()
		{
			if (this.initialization_completed && this.is_started)
			{
				_.isFunction(this.options.beforeEachReady) && this.options.beforeEachReady.call(this);
			}
		};

		helper.prototype.beforeEach = function ()
		{
			var self = this;
			beforeEach(function ()
			{
				runs(function ()
				{
					self.runBeforeEach();
				});

				// Makes sure the application is started before continue
				waitsFor(function ()
				{
					return self.isBeforeEachReady();
				});
			});
		};

		helper.prototype.runBeforeEach = function ()
		{
			var self = this;
			this.is_started = false;
			Backbone.history.start();

			//Configure basic HTML structure
			SC.templates.layout_tmpl = '<div id="content"></div>';
			if (!jQuery('#main').length)
			{
				jQuery('body').append('<div id="main"></div>');
			}

			//Mock Ajax Calls
			jasmine.Ajax.install();
			jQuery.ajaxSetup({cache: true}); //Prevent underscore parameter in request url

			// Starts the application
			jQuery(self.application.start(function ()
			{
				if (SC.ENVIRONMENT.CART && _.isFunction(self.application.getCart) && self.application.getCart())
				{
					self.application.getCart().set(SC.ENVIRONMENT.CART);
				}

				if (SC.ENVIRONMENT.PROFILE)
				{
					self.application.getUser().set(SC.ENVIRONMENT.PROFILE);
					// delete SC.ENVIRONMENT.PROFILE;
				}

				if (SC.ENVIRONMENT.ADDRESS && self.application.getUser().get('addresses'))
				{
					self.application.getUser().get('addresses').reset(SC.ENVIRONMENT.ADDRESS);
					// delete SC.ENVIRONMENT.ADDRESS;
				}

				if (SC.ENVIRONMENT.CREDITCARD && self.application.getUser().get('creditcards'))
				{
					self.application.getUser().get('creditcards').reset(SC.ENVIRONMENT.CREDITCARD);
					// delete SC.ENVIRONMENT.CREDITCARD;
				}

				self.layout = self.application.getLayout();
				self.layout.appendToDom(); //we can work without appending to the DOM
				self.layout.render();

				self._insternalLoadCompleted();
				self.is_started = true;
			}));
		};

		helper.prototype.isBeforeEachReady = function ()
		{
			return this.initialization_completed && this.is_started;
		};

		helper.prototype.afterEach = function ()
		{
			//Restore Ajax Usage
			jasmine.Ajax.uninstall();

			//Unattach view from events
			this.application.getLayout().undelegateEvents();
			this.application.getLayout().$el.removeData().unbind();
			this.application.getLayout().remove();

			//Clean the current URL Hash
			Backbone.history.navigate('', {trigger: false});
			Backbone.history.stop();
		};

		return helper;
	})();

});
