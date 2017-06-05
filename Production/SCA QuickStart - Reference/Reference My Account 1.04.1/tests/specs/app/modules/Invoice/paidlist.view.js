/*jshint laxcomma:true*/
define(['Invoice','jasmineTypeCheck'], function (InvoiceModule)
{
    'use strict';

      return describe('Paid Invoices List View', function ()
    {
        var fakeInvoiceCollection
        ,   fakeApplication;

        beforeEach(function()
        {
            fakeApplication = {
                getUser: function()
                {
                    return {
                        get: function()
                        {
                            return fakeInvoiceCollection;
                        }
                    };
                }
            };
            fakeInvoiceCollection = new InvoiceModule.InvoiceCollection();
        });

        describe('Initialize', function ()
        {
            it ('should initialize with user open invoices', function()
            {
                var view = new InvoiceModule.PaidListView({application: fakeApplication, collection: new InvoiceModule.InvoiceCollection()});

                expect(view.collection).toBeDefined();
                expect(view.collection.length).toEqual(0);
            });

            it ('should attach on user invoes sync or reset', function()
            {
                spyOn(fakeInvoiceCollection, 'on');

                var view = new InvoiceModule.PaidListView({application: fakeApplication, collection: fakeInvoiceCollection});

                expect(fakeInvoiceCollection.on).toHaveBeenCalled();
                var funArguments = fakeInvoiceCollection.on.mostRecentCall.args[0];
                expect(funArguments.indexOf('sync') >= 0).toBeTruthy();
                expect(funArguments.indexOf('reset') >= 0).toBeTruthy();

            });
        });
    });
});