// TransactionHistory.Router.js
// -----------------------
// Router for handling orders
define('TransactionHistory.Router'
	,	[
			'TransactionHistory.Collection'
		,	'TransactionHistory.Views'
		,	'Deposit.Model'
		,	'Deposit.Views'
		,	'DepositApplication.Model'
		,	'DepositApplication.Views'
		,	'CreditMemo.Model'
		,	'CreditMemo.Views'
		,	'CustomerPayment.Model'
		,	'CustomerPayment.Views'
		]
	,	function (Collection, Views, DepositModel, DepositViews, DepositApplicationModel, DepositApplicationViews, CreditMemoModel, CreditMemoViews, CustomerPaymentModel, CustomerPaymentViews)
{

	'use strict';

	return Backbone.Router.extend({

		routes: {
			'transactionhistory': 'transactionHistory'
		,	'transactionhistory?:options': 'transactionHistory'
		,	'transactionhistory/creditmemo/:id': 'creditmemoDetails'
		,	'transactionhistory/depositapplication/:id': 'depositapplicationDetails'
		,	'transactionhistory/customerdeposit/:id': 'despositDetails'
		,	'transactionhistory/customerpayment/:id': 'customerPaymentDetails'
		}

	,	initialize: function (application)
		{
			this.application = application;
		}

		// list transactions history
	,	transactionHistory: function (options)
		{
			options = (options) ? SC.Utils.parseUrlOptions(options) : {page: 1};
			
			options.page = options.page || 1;

			var collection = new Collection()
			,	view = new Views.List({
					application: this.application
				,	collection: collection
				,	page: options.page
				});

			collection.on('reset', view.showContent, view);

			view.showContent();
		}

		// view credit memo detail
	,	creditmemoDetails: function (id)
		{
			var model = new CreditMemoModel({internalid: id})
			,	view = new CreditMemoViews.Details({
					application: this.application
				,	id: id
				,	model: model
				});

			model
				.on('change', view.showContent, view)
				.fetch({
					killerId: this.application.killerId
				});
		}

		// view deposit application detail
	,	customerPaymentDetails: function (id)
		{
			var model = new CustomerPaymentModel({ internalid: id })
			,	view = new CustomerPaymentViews.Details({
					application: this.application
				,	id: id
				,	model: model
				});

			model
				.on('change', view.showContent, view)
				.fetch({
					killerId: this.application.killerId
				});
		}

		// view deposit detail
	,	despositDetails: function (id)
		{
			var model = new DepositModel({ internalid: id })
			,	view = new DepositViews.Details({
					application: this.application
				,	id: id
				,	model: model
				});

			model
				.on('change', view.showContent, view)
				.fetch({
					killerId: this.application.killerId
				});
		}

		// view deposit application detail
	,	depositapplicationDetails: function (id)
		{
			var model = new DepositApplicationModel({ internalid: id })
			,	view = new DepositApplicationViews.Details({
					application: this.application
				,	id: id
				,	model: model
				});

			model
				.on('change', view.showContent, view)
				.fetch({
					killerId: this.application.killerId
				});
		}
	});
});
