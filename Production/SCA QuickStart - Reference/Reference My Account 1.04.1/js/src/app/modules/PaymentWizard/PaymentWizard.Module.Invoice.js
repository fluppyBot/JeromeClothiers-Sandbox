define('PaymentWizard.Module.Invoice', ['Wizard.Module', 'ListHeader', 'Invoice', 'PaymentWizard.EditAmount.View'], function (WizardModule, ListHeader, Invoice, EditAmountView)
{
	'use strict';

	// returns the amount of days based on milliseconds
	function getDays(milliseconds)
	{
		return milliseconds / 1000 / 60 / 60 / 24;
	}

	return WizardModule.extend({

		template: 'payment_wizard_invoice_module'

	,	events: {
			'click [data-type="invoice"]:not(.disabled)': 'toggleInvoiceHandler'
		,	'click [data-action="edit"]': 'editInvoice'
		}

	,	initialize: function (options)
		{
			this.wizard = options.wizard;
			this.invoices = new Invoice.InvoiceCollection();
			this.invoices.reset(this.wizard.model.get('invoices').models);

			// PaymentWizard.Module.Invoice.listHeader:
			// manges sorting and filtering of the collection
			this.listHeader = new ListHeader({
				view: this
			,	application: options.wizard.application
			,	collection: this.invoices
			,	filters: this.filterOptions
			,	sorts: this.sortOptions
			,	selectable: true
			});

			this.addEventListeners();
		}

	,	addEventListeners: function ()
		{
			var self = this;
			// Whenever the invoice collection changes, we re write
			this.invoices.on('reset', jQuery.proxy(this, 'render'));

			this.wizard.model.on('change:invoices_total', jQuery.proxy(this, 'render'));

			this.wizard.model.on('change:invoices', function()
			{
				self.invoices.clearFilters();
				self.invoices.reset(self.wizard.model.get('invoices').models);
				self.invoices.original = self.invoices.clone();
			});
		}

		// the render is called whenever the invoice collection is resetd
		// to prevent multiple innecesary renders, we use this boolean flag
		// so the "real" render will only happen if the step is present
	,	present: function ()
		{
			this.renderable = true;
			this.listHeader.updateCollection();
		}

	,	render: function ()
		{
			if (this.renderable)
			{
				this._render();
			}
		}

		// Array of default filter options
		// filters always apply on the original collection
	,	filterOptions: [
			{
				value: 'overdue'
			,	name: _('Show overdue').translate()
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
			,	name: _('Show due next 7 days').translate()
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
			,	name: _('Show due next 30 days').translate()
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
			,	name: _('Show due next 60 days').translate()
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
			,	name: _('Show due next 90 days').translate()
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
			,	name: _('Show all').translate()
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
			,	name: _('by Due Date').translate()
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
				value: 'invoicenumber'
			,	name: _('by Invoice Number').translate()
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
			,	name: _('by Amount Due').translate()
			,	sort: function ()
				{
					return this.sortBy(function (invoice)
					{
						return invoice.get('amount');
					});
				}
			}
		]

		// When an invoice is clicked, call toggleInvoice
	,	toggleInvoiceHandler: function (e)
		{
			var $target = jQuery(e.target);
			
			if ($target.data('toggle') !== 'show-in-modal')
			{
				this.toggleInvoice($target.closest('[data-type="invoice"]').data('id'));
			}
		}

	,	toggleInvoice: function (invoice)
		{
			invoice = this.invoices.get(invoice);

			if (invoice)
			{
				// toggles the state of the invoice, by selecting or unselecting it
				this[invoice.get('apply') ? 'unselectInvoice' : 'selectInvoice'](invoice);
			}
			this.render();
		}
		// tries to select the invoice
	,	selectInvoice: function (invoice)
		{
			invoice.set('checked', true);
			this.wizard.model.selectInvoice(invoice);
			this.render();
		}

		// tries to unselect the invoice
	,	unselectInvoice: function (invoice)
		{
			invoice.set('checked', false);
			this.wizard.model.unselectInvoice(invoice);
			this.render();
		}

		// selects all invoices
	,	selectAll: function ()
		{
			var self = this
			,	has_changed = false;

			this.invoices.each(function (invoice)
			{
				if (!invoice.get('apply'))
				{
					has_changed = true;
					// select the invoice
					self.selectInvoice(invoice);
				}
			});
		}

		// unselects all invoices
	,	unselectAll: function ()
		{
			var self = this
			,	has_changed = false;
			
			this.invoices.each(function (invoice)
			{
				if (invoice.get('apply'))
				{
					has_changed = true;
					// unselects the invoice
					self.unselectInvoice(invoice);
				}
			});
		}

	,	editInvoice: function (e)
		{
			var $target = jQuery(e.target)
			,	$invoice = $target.closest('[data-type="invoice"]')
			,	$checkbox = $invoice.find('[data-action="select"]')
			,	invoice = this.invoices.get($checkbox.val());

			e.preventDefault();
			e.stopPropagation();

			this.wizard.application.getLayout().showInModal(
				new EditAmountView({
					application: this.wizard.application
				,	parentView: this
				,	model: invoice
				,	type: 'invoice'
				})
			,	{
					application: this.wizard.application
				}
			);
		}

		// whenever this module is in the past
	,	past: function ()
		{
			var wizard = this.wizard;
			// if the payment model doesn't has any invoice selected
			if (!wizard.model.getSelectedInvoices().length && !wizard.model.get('confirmation'))
			{
				// that is just wrong, get back to the first step son
				wizard.navigate('/'+ wizard.steps[wizard.stepsOrder[0]].stepGroup.url);
			}
		}
	});
});
