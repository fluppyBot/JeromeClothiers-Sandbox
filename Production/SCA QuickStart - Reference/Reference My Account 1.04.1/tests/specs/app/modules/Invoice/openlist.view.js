/*jshint laxcomma:true*/
define(['Invoice','jasmineTypeCheck'], function (InvoiceModule)
{
	'use strict';

	return describe('Open Invoices List View', function ()
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
				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: new InvoiceModule.InvoiceCollection()});

				expect(view.collection).toBeDefined();
				expect(view.collection.length).toEqual(0);
			});

			it ('should attach on user invoes sync or reset', function()
			{
				spyOn(fakeInvoiceCollection, 'on');

				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: fakeInvoiceCollection});

				expect(fakeInvoiceCollection.on).toHaveBeenCalled();
				var funArguments = fakeInvoiceCollection.on.mostRecentCall.args[0];
				expect(funArguments.indexOf('sync') >= 0).toBeTruthy();
				expect(funArguments.indexOf('reset') >= 0).toBeTruthy();

			});
		});

		describe('getSelectedInvoicesLength', function ()
		{
			it('should return 0 if there is no invocie selected', function()
			{
				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: new InvoiceModule.InvoiceCollection()});

				var result = view.getSelectedInvoicesLength();

				expect(result).toBe(0);
			});

			it('should return the number of selected invoice', function()
			{
				fakeInvoiceCollection.add([
					{
						status: {
							internalid: 'open'
						}
					}
				,   {
						status: {
							internalid: 'paidInFull'
						}
				}]);

				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: fakeInvoiceCollection});
				fakeInvoiceCollection.first().set('checked', true);

				var result = view.getSelectedInvoicesLength();

				expect(result).toBe(1);
			});
		});

		describe('toggleInvoice', function ()
		{
			it ('should call selectInvoice if specified invoice is unselected', function ()
			{
				fakeInvoiceCollection.add([
						{
							status: {
								internalid: 'open'
							}
						,	id: 123
						}
					,	{
							status: {
								internalid: 'paidInFull'
							}
					}]);
				
				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: fakeInvoiceCollection});
				spyOn(view, 'selectInvoice');
				view.toggleInvoice('123');

				expect(view.selectInvoice).toHaveBeenCalled();
			});

			it ('should call unselectInvoice if specified invoice is selected', function ()
			{
				var fake_LivePayment = {
						selectInvoice : jasmine.createSpy('fake select Invocie method')
					};
				fakeApplication.getLivePayment = function ()
				{
					return fake_LivePayment;
				};

				fakeInvoiceCollection.reset([
						{
							status: {
								internalid: 'open'
							}
						,   id: 123
						}
					,   {
							status: {
								internalid: 'paidInFull'
							}
					}]);

				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: fakeInvoiceCollection});

				view.collection.first().set('checked', true);

				spyOn(view, 'unselectInvoice');
				view.toggleInvoice('123');                

				expect(view.unselectInvoice).toHaveBeenCalled();
			});

			it ('should not call unselectInvoice nor selectInvoice if specified invoice is not valid', function ()
			{                
				var fake_LivePayment = {
						selectInvoice : jasmine.createSpy('fake select Invocie method')
					};
				fakeApplication.getLivePayment = function ()
				{
					return fake_LivePayment;
				};

				fakeInvoiceCollection.reset([
						{
							status: {
								internalid: 'open'
							}
						,   id: 123
						}
					,   {
							status: {
								internalid: 'paidInFull'
							}
					}]);

				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: fakeInvoiceCollection});

				view.collection.first().set('checked', true);

				spyOn(view, 'unselectInvoice');
				spyOn(view, 'selectInvoice');
				view.toggleInvoice('957');

				expect(view.unselectInvoice).not.toHaveBeenCalled();
				expect(view.selectInvoice).not.toHaveBeenCalled();
			});
		});

		describe('selectInvoice', function ()
		{
			it ('should set checked to true', function ()
			{
				var fake_LivePayment = {
						selectInvoice : jasmine.createSpy('fake select Invocie method')
					};
				fakeApplication.getLivePayment = function ()
				{
					return fake_LivePayment;
				};
				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: new InvoiceModule.InvoiceCollection()})
				,   invoice = new InvoiceModule.Model();

				view.selectInvoice(invoice);

				expect(invoice.get('checked')).toBeTruthy();
				expect(fake_LivePayment.selectInvoice).toHaveBeenCalled();
			});
		});

		describe('unselectInvoice', function ()
		{
			it ('should set checked to false', function ()
			{
				var fake_LivePayment = {
						unselectInvoice : jasmine.createSpy('fake select Invocie method')
					};
				fakeApplication.getLivePayment = function ()
				{
					return fake_LivePayment;
				};
				var view = new InvoiceModule.OpenListView({application: fakeApplication, collection: new InvoiceModule.InvoiceCollection()})
				,   invoice = new InvoiceModule.Model();
				invoice.set('checked', true);
				
				view.unselectInvoice(invoice);

				expect(invoice.get('checked')).toBeFalsy();
				expect(fake_LivePayment.unselectInvoice).toHaveBeenCalled();
			});
		});
	});
});