/*global SC:false, Backbone:false, it:false, describe:false, define:false, expect:false, beforeEach:false, afterEach:false, jQuery:false, waitsFor:false, spyOn: false */
/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, browser:true, quotmark:single, maxerr:50, laxcomma:true, expr:true*/

// Cart.js
// --------------------
// Testing Cart module.
define(['Cart', 'Application','SC.ENVIRONMENT', 'jasmineTypeCheck'], function ()
{

	'use strict';

	describe('Module: Cart', function () {

		var is_started = false
		,	application;

		beforeEach(function ()
		{
			if (!is_started)
			{
				// Here is the appliaction we will be using for this tests
				application = SC.Application('Cart');
				// This is the configuration needed by the modules in order to run
				application.Configuration =  {
					modules: [ 'Cart' ]
				};
				// Starts the application
				jQuery(application.start(function () { is_started = true; }));
				// Makes sure the application is started before
				waitsFor(function() { return is_started; });
			}
		});

		afterEach(function()
		{
			delete SC._applications.Cart;
			try
			{
				Backbone.history.navigate('', {trigger: false});
				Backbone.history.stop();
			} catch(ex) {}
		});

		it('#1: application.getCart not to be undefined', function() {
			expect(application.getCart).not.toBe(undefined);
		});

		it('#2: application.getCart to be function', function() {
			expect(application.getCart).toBeA(Function);
		});

		it('#3: application.getCart return Backbone.model', function() {
			expect(application.getCart()).toBeA(Backbone.Model);
		});

		it('#4: internalid of model to be "cart"', function() {
			expect(application.getCart().get('internalid')).toBe('cart');
		});

		it('#5: addresses of model not to be undefined', function() {
			expect(application.getCart().get('addresses')).not.toBe(undefined);
		});

		it('#6: paymentmethods of model not to be undefined', function() {
			expect(application.getCart().get('paymentmethods')).not.toBe(undefined);
		});

		it('#7: shipmethods of model not to be undefined', function() {
			expect(application.getCart().get('shipmethods')).not.toBe(undefined);
		});

		it('#8: layout.updateMiniCart not to be undefined', function() {
			var layout = application.getLayout();
			expect(layout.updateMiniCart).not.toBe(undefined);
		});

		it('#9: layout.updateMiniCart to be function', function() {
			var layout = application.getLayout();
			expect(layout.updateMiniCart).toBeA(Function);
		});

		it('#10: layout.showMiniCart not to be undefined', function() {
			var layout = application.getLayout();
			expect(layout.showMiniCart).not.toBe(undefined);
		});

		it('#11: layout.showMiniCart to be function', function() {
			var layout = application.getLayout();
			expect(layout.showMiniCart).toBeA(Function);
		});

		it('#12: layout.showCartConfirmationModal not to be undefined', function() {
			var layout = application.getLayout();
			expect(layout.showCartConfirmationModal).not.toBe(undefined);
		});

		it('#13: layout.showCartConfirmationModal to be function', function() {
			var layout = application.getLayout();
			expect(layout.showCartConfirmationModal).toBeA(Function);
		});

		it('#14: layout.goToCart not to be undefined', function() {
			var layout = application.getLayout();
			expect(layout.goToCart).not.toBe(undefined);
		});

		it('#15: layout.goToCart to be function', function() {
			var layout = application.getLayout();
			expect(layout.goToCart).toBeA(Function);
		});

		it('#16: layout.goToCart() must navigate to the url "#cart"', function() {
			var layout = application.getLayout();
			Backbone.history.start();
			layout.goToCart();
			expect(window.location.hash).toBe('#cart');
		});

		it('#17: application.loadCart must be a function', function() {
			expect(application.loadCart).toBeA(Function);
		});

		it('#18: application.loadCart must return a promise', function()
		{
			spyOn(application.getCart(), 'fetch').andCallFake(function()
			{
				return jQuery.Deferred();
			});

			application.cartLoad = null;
			var cart = application.loadCart();
			expect(cart.done).toBeA(Function);
			expect(application.getCart().fetch).toHaveBeenCalled();
		});

	});

});