define('Invoice.PaidList.View', ['Invoice.Collection', 'ListHeader'], function (InvoiceCollection, ListHeader)
{
	'use strict';
	
	return Backbone.View.extend({

		template: 'paid_invoices_list'

	,	title: _('Invoices').translate()
	
	,	page_header: _('Invoices').translate()

	,	attributes: {
			'class': 'PaidInvoices'
		}

	,	initialize: function (options)
		{
			this.user = options.application.getUser();
						
			// manges sorting and filtering of the collection
			this.listHeader = new ListHeader({
				view: this
			,	application : options.application
			,	collection: this.collection
			,	sorts: this.sortOptions
			,	rangeFilter: 'date'
			});

			this.collection.on('sync reset', jQuery.proxy(this, 'render'));
		}

	,	showContent: function ()
		{
			//Update My Account menu indicating that the invoice option is selected
			this.options.application.getLayout().showContent(this, 'invoices', [{
				text: this.title
			,	href: '/paid-invoices'
			}]);
		}

		// Array of default sort options
		// sorts only apply on the current collection
		// which might be a filtered version of the original
	,	sortOptions: [
			{
				value: 'closedate'
			,	name: _('By Close Date').translate()
			,	selected: true
			,	sort: function ()
				{
					return this.sortBy(function (invoice)
					{
						return [invoice.get('closedateInMilliseconds'), invoice.get('tranid')];
					});
				}
			}
		,	{
				value: 'trandate'
			,	name: _('By Invoice Date').translate()
			,	sort: function ()
				{
					return this.sortBy(function (invoice)
					{
						return [invoice.get('tranDateInMilliseconds'), invoice.get('tranid')];
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
			,	name: _('By Amount').translate()
			,	sort: function ()
				{
					return this.sortBy(function (invoice)
					{
						return invoice.get('summary').total;
					});
				}
			}
		]
		
	,	rangeFilterOptions : {
			fromMin: '1800-01-02'
		,	toMin: '1800-01-02'
		}
	});
});
