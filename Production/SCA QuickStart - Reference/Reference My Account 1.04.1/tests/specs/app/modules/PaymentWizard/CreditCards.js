/*jshint  evil:true, laxcomma:true*/
define(['PaymentWizard.Module.PaymentMethod.Creditcard', 'PaymentWizard', 'CreditCard.Collection', 'LivePayment', 'PaymentWizard.Module.Invoice', 'PaymentWizard.Module.ShowInvoices', 'PaymentWizard.Module.ShowTotal', 'PaymentWizard.Module.ShowPayments','PaymentWizard.Module.ConfirmationNavigation'],
	function (CreditCardModule, PaymentWizard, CreditCardsCollection, LivePaymentModule)
{
	'use strict';

	return describe('Credit Card Module', function ()
	{
		// initial setup required for this test: we will be working with views.
		// some of these tests require that some macros are loaded, so we load them all:
		jQuery.ajax({url: '../../../../../templates/Templates.php', async: false}).done(function(data){
			eval(data);
			SC.compileMacros(SC.templates.macros);
		});
		// jQuery('<link>').appendTo(jQuery('head')).attr({type : 'text/css', rel : 'stylesheet'}).attr('href', '../../../../../skins/standard/styles.css');
		
		it('Test Credit Card initialize', function ()
		{
			var app = SC.Application('MyAccount');
			app.getUser().set('creditcards', new CreditCardsCollection());

			LivePaymentModule.mountToApp(app);

			var wiz = PaymentWizard.mountToApp(app);
			var ccm = new CreditCardModule({wizard: wiz});

			ccm.isValid();
			ccm.changeCreditCard();
		});
	});
});