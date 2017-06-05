/*jshint laxcomma:true*/
define(['TransactionHistory.Model'], function (TransactionHistoryModel)
{
	'use strict';

	return describe('TransactionHistory Module', function ()
	{
		it('Basic test on getting type label for all type of records', function (){
			var thm = new TransactionHistoryModel();

			thm.set('recordtype','creditmemo');
			expect(thm.getTypeLabel()).toEqual('Credit Memo');
			
			thm.set('recordtype','customerdeposit');
			expect(thm.getTypeLabel()).toEqual('Deposit');

			thm.set('recordtype','customerpayment');
			expect(thm.getTypeLabel()).toEqual('Payment');

			thm.set('recordtype','depositapplication');
			expect(thm.getTypeLabel()).toEqual('Deposit Application');
		});
	});
});