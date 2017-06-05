/*jshint evil:true, laxcomma:true */
// Testing Deposit Views
define(['Deposit.Model', 'Deposit.Views', 'Application'], function (DepositModel, DepositViews)
{
	'use strict';

	describe('Deposit.Views', function ()
	{
		var DEPOSIT_MOCK = {'internalid':'1749','tranid':'8','payment':500,'payment_formatted':'$500,00','trandate':'3/10/2014','status':'Not Deposited','memo':'Deposit of $500','invoices':[{'line':1,'invoice_id':'1680','deposit_id':'2069','type':'Invoice','total':2190,'total_formatted':'$2 190,00','invoicedate':'2/24/2014','depositdate':'4/1/2014','currency':null,'amount':10,'amount_formatted':'$10,00','due':0,'due_formatted':'$0,00','refnum':'0227'},{'line':2,'invoice_id':'1755','deposit_id':'2069','type':'Invoice','total':332,'total_formatted':'$332,00','invoicedate':'3/11/2014','depositdate':'4/1/2014','currency':null,'amount':31,'amount_formatted':'$31,00','due':0,'due_formatted':'$0,00','refnum':'0231'}],'paid':41,'paid_formatted':'$41,00','remaining':459,'remaining_formatted':'$459,00','paymentmethods':[{'type':'creditcard','primary':true,'creditcard':{'ccnumber':'************7542','ccexpiredate':'05/2016','ccname':'Sebastian Faedo','paymentmethod':{'ispaypal':'F','name':'VISA','creditcard':'T','internalid':'5'}},'ccstreet':'Luis Alberto de Herrera','cczipcode':'11300'}]}
		,	DEPOSIT_MOCK_NO_INVOICES = {'internalid':'1749','tranid':'8','payment':500,'payment_formatted':'$500,00','trandate':'3/10/2014','status':'Not Deposited','memo':'Deposit of $500','paid':41,'paid_formatted':'$41,00','remaining':459,'remaining_formatted':'$459,00','paymentmethods':[{'type':'creditcard','primary':true,'creditcard':{'ccnumber':'************7542','ccexpiredate':'05/2016','ccname':'Sebastian Faedo','paymentmethod':{'ispaypal':'F','name':'VISA','creditcard':'T','internalid':'5'}},'ccstreet':'Luis Alberto de Herrera','cczipcode':'11300'}]}
		,	application = null
		,	is_started;

		beforeEach(function ()
		{
			// initial setup required for this test: we will be working with views.
			// some of these tests require that some macros are loaded, so we load them all:
			jQuery.ajax({url: '../../../../../templates/Templates.php', async: false}).done(function(data){
				eval(data);
				SC.compileMacros(SC.templates.macros);
			});

			application = SC.Application('DepositViewsTest');
			application.Configuration =  {
				modules: ['Deposit']
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

			expect(view.$('.deposit-number').text()).toBe('#8');
			expect(view.$('.deposit-payment').text()).toBe('$500,00');

			expect(view.$('.deposit-memo').text()).toBe('Deposit of $500');
			expect(view.$('.deposit-remaining').text()).toBe('$459,00');
			expect(view.$('.deposit-applied').text()).toBe('$41,00');
			expect(view.$('.deposit-invoice').size()).toBe(2);

			expect(view.$('.invoice-1680').size()).toBe(1);
			expect(view.$('.invoice-1680').find('.invoice-number').text()).toBe('0227');
			expect(view.$('.invoice-1680').find('.invoice-date').text()).toBe('2/24/2014');
			expect(view.$('.invoice-1680').find('.deposit-application-date').text()).toBe('4/1/2014');
			expect(view.$('.invoice-1680').find('.invoice-amount').text()).toBe('$10,00');
			expect(view.$('.invoice-1755').size()).toBe(1);
			expect(view.$('.invoice-1755').find('.invoice-number').text()).toBe('0231');
			expect(view.$('.invoice-1755').find('.invoice-date').text()).toBe('3/11/2014');
			expect(view.$('.invoice-1755').find('.deposit-application-date').text()).toBe('4/1/2014');
			expect(view.$('.invoice-1755').find('.invoice-amount').text()).toBe('$31,00');
		});

		it('should show no invoices', function()
		{
			var model = new DepositModel(DEPOSIT_MOCK_NO_INVOICES);
			var view = new DepositViews.Details({ application: application, model: model });

			view.render();

			expect(view.$('.deposit-invoice').size()).toBe(0);
			expect(view.$('.deposit-noinvoices').text()).toBe('This Deposit has not been applied to any invoices yet.');
		});
	});
});
