// Invoice.Router.js
// -----------------------
// Router for handling Invoices views
define('Invoice.Router', ['Invoice.Collection', 'Invoice.Model', 'Invoice.OpenList.View', 'Invoice.PaidList.View', 'Invoice.Details.View'],
	function (Collection, InvoiceModel, OpenListView, PaidListView, DetailsView)
{
	'use strict';

	return Backbone.Router.extend({

		routes: {
			'invoices': 'showOpenInvoicesList'
		,	'invoices?*options': 'showOpenInvoicesList'
		,	'paid-invoices': 'showPaidInvoicesList'
		,	'paid-invoices?*options': 'showPaidInvoicesList'
		,	'invoices/:id': 'showInvoice'
		,	'invoices/:id/:referer': 'showInvoice'
		}

	,	initialize: function (application)
		{
			this.application = application;
		}

	,	showOpenInvoicesList: function ()
		{
			var collection = new Collection()
			,	view = new OpenListView({
					application: this.application
				,	collection: collection
				});

			collection
				.on('sync', view.showContent, view)
				.fetch({
					data: {
						type: 'invoice'
					,	status: 'open'
					}
				,	killerId: this.application.killerId
				});
		}

	,	showPaidInvoicesList: function ()
		{
			var collection = new Collection()
			,	view = new PaidListView({
					application: this.application
				,	collection: collection
				});

			collection
				.on('sync', view.showContent, view)
				.fetch({
					data: {
						type: 'invoice'
					,	status: 'paid'
					}
				});
		}

	,	showInvoice: function (invoice_id, referer)
		{
			var invoice = new InvoiceModel({internalid: invoice_id})
			,	view = new DetailsView({
					application: this.application
				,	model: invoice
				,	referer: referer
				});

			invoice
				.on('change', view.showContent, view)
				.fetch({
					data: {
						type: 'invoice'
					}
				,	killerId: this.application.killerId
				});
		}
	});
});
