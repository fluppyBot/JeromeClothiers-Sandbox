/*jshint laxcomma:true*/
define(['DepositApplication','jasmineTypeCheck'], function (DepositApplicationModule)
{
	'use strict';

	return describe('DepositApplication Module', function() {

		describe('Public Properties Exposed', function() {

			it('should have public properties for each of its components', function() {
				expect(DepositApplicationModule).toBeDefined();
				expect(DepositApplicationModule.Model).toBeDefined();
				expect(DepositApplicationModule.Views).toBeDefined();
			});
		});
	});
});