// Invoice.Views.js
// -----------------------
// Views for handling invoices listing
define('Invoice.OpenList.View', ['Invoice.Collection', 'ListHeader'], function (InvoiceCollection, ListHeader)
{
	'use strict';

	// returns the amount of days based on milliseconds
	function getDays(milliseconds)
	{
		return milliseconds / 1000 / 60 / 60 / 24;
	}
	
	return Backbone.View.extend({

		template: 'open_invoices_list'

	,	title: _('Invoices').translate()

	,	page_header: _('Invoices').translate()

	,	attributes: {
			'class': 'Invoices'
		}

	,	events: {
			'click [data-type="invoice"]': 'toggleInvoiceHandler'
		}

	,	initialize : function (options)
		{
			var self = this
			,	application = options.application;

			this.application = application;
			this.user = application.getUser();

			// manges sorting and filtering of the collection
			this.listHeader = new ListHeader({
				view: this
			,	application: application
			,	collection: this.collection
			,	filters: this.filterOptions
			,	sorts: this.sortOptions
			,	selectable: true
			});

			this.collection.on('sync reset', function ()
			{
				var collection = this;

				application.getLivePayment().getSelectedInvoices().each(function (invoice)
				{
					collection.get(invoice).set('checked', true);
				});

				self.render();
			});
		}

		//Returns the count of selected invoices (This method is used by the template) 
	,	getSelectedInvoicesLength: function()
		{
			return this.collection.filter(function (invoice)
			{
				return invoice.get('checked');
			}).length;
		}

		//Handle to used to change the status of an invoice
	,	toggleInvoiceHandler: function (e)
		{
			this.toggleInvoice(jQuery(e.target).closest('[data-type="invoice"]').data('id'));
		}

		//Change the state (selected/unselected) of the specified invoice Model
	,	toggleInvoice: function (invoice)
		{
			invoice = this.collection.get(invoice);

			if (invoice)
			{
				this[invoice.get('checked') ? 'unselectInvoice' : 'selectInvoice'](invoice);
				this.render();
			}
		}

		//select a specified invoice Model
	,	selectInvoice: function (invoice)
		{
			if (invoice)
			{
				invoice.set('checked', true);
			}

			return this.application.getLivePayment().selectInvoice(invoice.id);
		}

		//unselect a specified invoice Model
	,	unselectInvoice: function (invoice)
		{
			if (invoice)
			{
				invoice.set('checked', false);
			}

			return this.application.getLivePayment().unselectInvoice(invoice.id);
		}

		// selects all invoices
	,	selectAll: function ()
		{
			var self = this
			,	has_changed = false;

			this.collection.each(function (invoice)
			{
				if (!invoice.get('checked'))
				{
					has_changed = true;
					// select the invoice
					self.selectInvoice(invoice, {
						silent: true
					});
				}
			});

			// The select all might've been called
			// on a collection that was already fully selected
			// so let's not due an painfull useless render, shall we?
			if (has_changed)
			{
				this.render();
			}
		}

		// unselects all invoices
	,	unselectAll: function ()
		{
			var self = this
			,	has_changed = false;

			this.collection.each(function (invoice)
			{
				if (invoice.get('checked'))
				{
					has_changed = true;
					// unselects the invoice
					self.unselectInvoice(invoice, {
						silent: true
					});
				}
			});

			// The unselect all might've been called
			// on a collection that had none selected
			// so let's not due an painfull useless render, shall we?
			if (has_changed)
			{
				this.render();
			}
		}

	,	showContent: function ()
		{
			this.options.application.getLayout().showContent(this, 'invoices', [{
				text: this.title
			,	href: '/invoices'
			}]);
		}

		// Array of default filter options
		// filters always apply on the original collection
	,	filterOptions: [
			{
				value: 'overdue'
			,	name: _('Show Overdue').translate()
			,	filter: function ()
				{
					return this.original.filter(function (invoice)
					{
						return !invoice.get('dueinmilliseconds') || invoice.get('isOverdue');
					});
				}
			}
		,	{
				value: 'next7days'
			,	name: _('Show Due next 7 days').translate()
			,	filter: function ()
				{
					return this.original.filter(function (invoice)
					{
						return !invoice.get('dueinmilliseconds') || getDays(invoice.get('dueinmilliseconds')) <= 7;
					});
				}
			}
		,	{
				value: 'next30days'
			,	name: _('Show Due next 30 days').translate()
			,	filter: function ()
				{
					return this.original.filter(function (invoice)
					{
						return !invoice.get('dueinmilliseconds') || getDays(invoice.get('dueinmilliseconds')) <= 30;
					});
				}
			}
		,	{
				value: 'next60days'
			,	name: _('Show Due next 60 days').translate()
			,	filter: function ()
				{
					return this.original.filter(function (invoice)
					{
						return !invoice.get('dueinmilliseconds') || getDays(invoice.get('dueinmilliseconds')) <= 60;
					});
				}
			}
		,	{
				value: 'next90days'
			,	name: _('Show Due next 90 days').translate()
			,	filter: function ()
				{
					return this.original.filter(function (invoice)
					{
						return !invoice.get('dueinmilliseconds') || getDays(invoice.get('dueinmilliseconds')) <= 90;
					});
				}
			}
		,	{
				value: 'all'
			,	name: _('Show All').translate()
			,	selected: true
			,	filter: function ()
				{
					return this.original.models;
				}
			}
		]

		// Array of default sort options
		// sorts only apply on the current collection
		// which might be a filtered version of the original
	,	sortOptions: [
			{
				value: 'duedate'
			,	name: _('By Due Date').translate()
			,	selected: true
			,	sort: function ()
				{
					return this.models.sort(function (invoiceOne, invoiceTwo)
					{
						var milli_inv_one = invoiceOne.get('dueinmilliseconds') || 0
						,	milli_inv_two = invoiceTwo.get('dueinmilliseconds') || 0;

						if (milli_inv_one !== milli_inv_two) 
						{
							return milli_inv_one < milli_inv_two ? -1 : 1;
						}

						return invoiceOne.get('tranid') < invoiceTwo.get('tranid') ? -1 : 1;
					});
				}
			}
		,	{
				value: 'trandate'
			,	name: _('By Invoice Date').translate()
			,	sort: function ()
				{
					return this.models.sort(function (invoiceOne, invoiceTwo)
					{
						var milli_inv_one = invoiceOne.get('tranDateInMilliseconds') || 0
						,	milli_inv_two = invoiceTwo.get('tranDateInMilliseconds') || 0;

						if (milli_inv_one !== milli_inv_two) 
						{
							return milli_inv_one < milli_inv_two ? -1 : 1;
						}

						return invoiceOne.get('tranid') < invoiceTwo.get('tranid') ? -1 : 1;
					});
				}
			}
		,	{
				value: 'invoicenumber'
			,	name: _('By Invoice Number').translate()
			,	sort: function ()
				{
					return this.sortBy(function (invoice)
					{
						return invoice.get('tranid');
					});
				}
			}
		,	{
				value: 'amountdue'
			,	name: _('By Amount Due').translate()
			,	sort: function ()
				{
					return this.sortBy(function (invoice)
					{
						return invoice.get('amountremaining');
					});
				}
			}
		]
	});
});
