/*jshint evil:true, laxcomma:true */
// Testing Deposit Views
define(
['DepositApplication.Model', 'DepositApplication.Views', 'Application'],
function (DepositModel, DepositViews)
{
	'use strict';

	describe('DepositApplication.Views', function ()
	{
		var DEPOSIT_MOCK = {'internalid':'2069','tranid':'19','total':41,'total_formatted':'$41,00','deposit':{'internalid':'1749','name':'Customer Deposit #8'},'depositdate':'3/10/2014','trandate':'4/1/2014','memo':'Paying only a part','invoices':[{'line':1,'internalid':'1680','type':'Invoice','total':2190,'total_formatted':'$2 190,00','apply':true,'applydate':'2/24/2014','currency':'USA','amount':10,'amount_formatted':'$10,00','due':1871,'due_formatted':'$1 871,00','refnum':'0227'},{'line':2,'internalid':'1755','type':'Invoice','total':332,'total_formatted':'$332,00','apply':true,'applydate':'3/11/2014','currency':'USA','amount':31,'amount_formatted':'$31,00','due':319,'due_formatted':'$319,00','refnum':'0231'}]}
		,	DEPOSIT_MOCK_NO_MEMO = {'internalid':'2069','tranid':'19','total':41,'total_formatted':'$41,00','deposit':{'internalid':'1749','name':'Customer Deposit #8'},'depositdate':'3/10/2014','trandate':'4/1/2014','invoices':[{'line':1,'internalid':'1680','type':'Invoice','total':2190,'total_formatted':'$2 190,00','apply':true,'applydate':'2/24/2014','currency':'USA','amount':10,'amount_formatted':'$10,00','due':1871,'due_formatted':'$1 871,00','refnum':'0227'},{'line':2,'internalid':'1755','type':'Invoice','total':332,'total_formatted':'$332,00','apply':true,'applydate':'3/11/2014','currency':'USA','amount':31,'amount_formatted':'$31,00','due':319,'due_formatted':'$319,00','refnum':'0231'}]}
		,	application = null
		,	is_started;

		it('Initial application setup', function () {
			// initial setup required for this test: we will be working with views.
			// some of these tests require that some macros are loaded, so we load them all:
			jQuery.ajax({url: '../../../../../templates/Templates.php', async: false}).done(function(data){
				eval(data);
				SC.compileMacros(SC.templates.macros);
			});

			application = SC.Application('DepositApplicationViewsTest');
			application.Configuration =  {
				modules: ['DepositApplication']
			};

			jQuery(application.start(function () {
				is_started = true;
			}));

			waitsFor(function() {
				return is_started;
			});
		});


		it('should show correct info', function()
		{
			var model = new DepositModel(DEPOSIT_MOCK);
			var view = new DepositViews.Details({ application: application, model: model });

			view.render();

			expect(view.$('.deposit-number').text()).toBe('#19');
			expect(view.$('.deposit-amount').text()).toBe('$41,00');
			expect(view.$('.deposit-date').text()).toBe('3/10/2014');
			expect(jQuery.trim(view.$('.deposit-transaction-date').text())).toBe('Transaction Date: 4/1/2014');
			expect(view.$('.deposit-link').text()).toBe('Customer Deposit #8');
			expect(view.$('.deposit-link').attr('href')).toBe('/transactionhistory/customerdeposit/1749');

			expect(view.$('.deposit-memo').text()).toBe('Paying only a part');
			// expect(view.$('.deposit-total').text()).toBe('$41,00');
			expect(view.$('.deposit-invoice').size()).toBe(2);

			expect(view.$('.invoice-1680').size()).toBe(1);
			expect(view.$('.invoice-1680').find('.invoice-number').text()).toBe('0227');
			expect(view.$('.invoice-1680').find('.invoice-number').attr('href')).toBe('/invoices/1680');
			expect(view.$('.invoice-1680').find('.invoice-date').text()).toBe('2/24/2014');
			expect(view.$('.invoice-1680').find('.invoice-amount').text()).toBe('$10,00');
			expect(view.$('.invoice-1755').size()).toBe(1);
			expect(view.$('.invoice-1755').find('.invoice-number').text()).toBe('0231');
			expect(view.$('.invoice-1755').find('.invoice-number').attr('href')).toBe('/invoices/1755');
			expect(view.$('.invoice-1755').find('.invoice-date').text()).toBe('3/11/2014');
			expect(view.$('.invoice-1755').find('.invoice-amount').text()).toBe('$31,00');

			expect(view.$('[data-type="accordion"]').size()).toBe(2);
		});

		it('should show no memo', function()
		{
			var model = new DepositModel(DEPOSIT_MOCK_NO_MEMO);
			var view = new DepositViews.Details({ application: application, model: model });

			view.render();

			expect(view.$('[data-type="accordion"]').size()).toBe(1);
		});
	});
});
