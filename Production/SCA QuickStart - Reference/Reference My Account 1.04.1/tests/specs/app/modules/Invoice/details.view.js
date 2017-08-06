/*jshint laxcomma:true*/
define(['Invoice'], function (InvoiceModule)
{
    'use strict';

    return describe('Invoice Details View', function ()
    {
        var view
        ,   fakeApplication = {};

        beforeEach(function ()
        {
            view = new InvoiceModule.DetailsView({application: fakeApplication});
        });

        describe('initialize', function ()
        {
            it ('should set applicatiojn property from options', function ()
            {
                expect(view.application).toEqual(fakeApplication);
            });

            it('should throw an exception if it is initialized without an applicaiton property', function ()
            {
                var wrapper = function() {
                    return new InvoiceModule.DetailsView(null);
                };

                expect(wrapper).toThrow();
            });
        });

        describe('make a payment action', function()
        {
            it ('should mark the specified invoice as detila and trigger userInvocesChange event', function () {

                var fakeInvoiceSetMethod =  jasmine.createSpy('fake set invoice method')
                ,   fakeInvoice = {
                        set: fakeInvoiceSetMethod
                    }
                ,   fakeInvoicesGetMethod = jasmine.createSpy('fake get invoices method').andCallFake(function ()
                    {
                        return fakeInvoice;
                    })
                ,   fakeTrigger = jasmine.createSpy('fake trigger invoices method')
                ,   fakeInvoices = {
                        get: fakeInvoicesGetMethod
                    ,   trigger : fakeTrigger
                    }
                ,   fakeUserGetMethod = jasmine.createSpy('fake get user method').andCallFake(function ()
                    {
                        return fakeInvoices;
                    })
                ,   fake_livePayment = {
                        selectInvoice : jasmine.createSpy('fake select invoice method')
                    }
                ,   fakeUser = {
                        get: fakeUserGetMethod
                    };
            
                fakeApplication.getLivePayment = function ()
                {
                    return fake_livePayment;
                };
                fakeApplication.getUser = function () 
                {
                    return fakeUser;
                };

                view.model = {
                    id: 12
                };
                
                view.makeAPayment();

                expect(fakeUserGetMethod).toHaveBeenCalledWith('invoices');
                expect(fake_livePayment.selectInvoice).toHaveBeenCalled();
                expect(fakeTrigger).toHaveBeenCalledWith('userInvocesChange');
            });
        });
    });
});