// TransactionHistory.Views.js
// -----------------------
// Views for order's details
define('TransactionHistory.Views', ['TrackingServices', 'ListHeader'], function (TrackingServices, ListHeader)
{
	'use strict';

	var Views = {};

	// view list of transaction history
	Views.List = Backbone.View.extend({

		template: 'transaction_history'

	,	title: _('Transaction History').translate()

	,	page_header: _('Transaction History').translate()

	,	attributes: {
			'class': 'TransactionHistory'
		}

	,	initialize: function (options)
		{
			var application = options.application;

			this.application = application;

			this.listenCollection();
		
			// manges sorting and filtering of the collection
			this.listHeader = new ListHeader({
				view: this
			,	application: application
			,	collection: this.collection
			,	filters: this.filterOptions
			,	sorts: this.sortOptions
			,	rangeFilter: 'date'
			});
		}

	,	listenCollection: function ()
		{
			this.setLoading(true);

			this.collection.on({
				request: jQuery.proxy(this, 'setLoading', true)
			,	reset: jQuery.proxy(this, 'setLoading', false)
			});
		}

	,	setLoading: function (bool)
		{
			this.isLoading = bool;
		}

	,	showContent: function ()
		{
			this.application.getLayout().showContent(this, 'transactionhistory', [{
				text: this.title
			,	href: '/transactionhistory'
			}]);
		}

		// Array of default filter options
		// filters always apply on the original collection
	,	filterOptions: [
			{
				value: 'all'
			,	name: _('Show all record types').translate()
			,	selected: true
			}
		,	{
				value: 'creditmemo'
			,	name: _('Show Credit Memo').translate()
			,	permission: 'transactions.tranCustCred.1'
			}
		,	{
				value: 'customerpayment'
			,	name: _('Show Payment').translate()
			,	permission: 'transactions.tranCustPymt.1'
			}
		,	{
				value: 'customerdeposit'
			,	name: _('Show Deposit').translate()
			,	permission: 'transactions.tranCustDep.1'
			}
		,	{
				value: 'depositapplication'
			,	name: _('Show Deposit Application').translate()
			,	permission: 'transactions.tranDepAppl.1'
			}
		,	{
				value: 'invoice'
			,	name: _('Show Invoices').translate()
			,	permission: 'transactions.tranCustInvc.1'
			}
		,	{
				value: 'returnauthorization'
			,	name: _('Show Return Authoziations').translate()
			,	permission: 'transactions.tranRtnAuth.1'
			}
		]

		// Array of default sort options
		// sorts only apply on the current collection
		// which might be a filtered version of the original
	,	sortOptions: [
			{
				value: 'date'
			,	name: _('by Date').translate()
			,	selected: true
			}
		,	{
				value: 'number'
			,	name: _('by Number').translate()
			}
		,	{
				value: 'amount'
			,	name: _('by Amount').translate()
			}
		]

	,	rangeFilterOptions : {
			fromMin: '1800-01-02'
		,	toMin: '1800-01-02'
		}
	});

	return Views;
});