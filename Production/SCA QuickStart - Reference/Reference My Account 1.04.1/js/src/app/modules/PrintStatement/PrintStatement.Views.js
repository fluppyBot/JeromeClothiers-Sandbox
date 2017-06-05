// PrintStatement.Views.js
// -----------------------
// Views for handling deposits view
define('PrintStatement.Views', function ()
{
	'use strict';

	var Views = {};

	Views.Details = Backbone.View.extend({

		template: 'print_statement'

	,	title: _('Print a Statement').translate()

	,	page_header: _('Print a Statement').translate()

	,	attributes: {
			'class': 'PrintStatement'
		}

	,	events: {
			'submit form':'printAction'
		,	'click [data-action="email"]':'emailAction'
		}

	,   initialize: function(options)
		{
			this.application = options.application;
			this.model = options.model;
			var rangeDays = this.application.getConfig('filterRangeQuantityDays');
			this.initialStatementDate = new Date();
			this.initialStartDate =  new Date();
			this.initialStartDate.setDate(this.initialStartDate.getDate() - rangeDays);
		}

	,	showContent: function()
		{
			var self = this;
			self.application.getLayout().showContent(self, 'printstatement', [{
				text: _('Print Statement').translate(),
				href: '/printstatement'
			}]);
		}
	,	printAction: function(e)
		{
			this.printStatement(e, false);
		}
	,	emailAction: function(e)
		{
			var self = this;
			this.printStatement(e, true, function (response)
			{
				jQuery.ajax(response.url).done(function ()
				{
					self.showError(_('Email sent successfully').translate(), 'success');
				});
			});
		}

	,	printStatement: function(e, email, callback)
		{
			e.preventDefault();
			this.hideError();
			
			var self = this
			,	data = jQuery(e.target).closest('form').serializeObject()
			,	statementDate = new Date(data.statementDate.replace(/-/g,'/')).getTime()
			,	startDate = new Date(data.startDate.replace(/-/g,'/')).getTime();
			
			data.email = email ? true : null;

			if (data.startDate && isNaN(startDate) || isNaN(statementDate))
			{
				self.showError(_('Invalid date format').translate());
			}
			else
			{
				data.statementDate = statementDate;
				if (data.startDate)
				{
					data.startDate = startDate;
				}

				if (email)
				{
					var	save_promise = this.saveForm(e, this.model, data);
					save_promise && save_promise.done(callback);
				}
				else
				{
					data.asset = 'print-statement';
					window.open(_.getDownloadPdfUrl(data));
				}
			}
		}
	});

	return Views;
});
