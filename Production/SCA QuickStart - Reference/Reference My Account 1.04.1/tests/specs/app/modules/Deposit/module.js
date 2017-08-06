/*jshint laxcomma:true*/
define(['Deposit','jasmineTypeCheck'], function (DepositModule)
{
	'use strict';

	return describe('Deposit Module', function() {

		describe('Public Properties Exposed', function() {

			it('should have public properties for each of its components', function() {
				expect(DepositModule).toBeDefined();
				expect(DepositModule.Model).toBeDefined();
				expect(DepositModule.Views).toBeDefined();
				expect(DepositModule.Collection).toBeDefined();
			});
		});
	});
});

