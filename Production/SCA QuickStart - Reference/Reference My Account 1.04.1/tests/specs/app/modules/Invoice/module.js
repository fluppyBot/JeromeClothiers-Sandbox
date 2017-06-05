/*jshint laxcomma:true*/
define(['Invoice','jasmineTypeCheck'], function (InvoiceModule)
{
	'use strict';

	return describe('Invoice Module', function() {

		describe('Public Properties Exposed', function() {

			it('should have public properties for each of its components', function() {
				expect(InvoiceModule).toBeDefined();
				expect(InvoiceModule.Model).toBeDefined();
                expect(InvoiceModule.InvoiceCollection).toBeDefined();
                expect(InvoiceModule.OpenListView).toBeDefined();
                expect(InvoiceModule.PaidListView).toBeDefined();
                expect(InvoiceModule.DetailsView).toBeDefined();
                expect(InvoiceModule.Router).toBeDefined();                
			});

            it ('should have an appropiate mounToApp method', function () 
            {
                var fakeUserSetMethod = jasmine.createSpy('fake user set method')
                ,   fakeApplication = {
                    getUser : function() {
                        return {
                            set: fakeUserSetMethod
                        };
                    }
                };

                var result = InvoiceModule.mountToApp(fakeApplication);

                expect(fakeUserSetMethod).toHaveBeenCalled();
                expect(result).toBeA(InvoiceModule.Router);
            });

		});

	});
});