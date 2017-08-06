/*jshint laxcomma:true*/
define(['SocialSharing', 'Application', 'jasmineTypeCheck'], function (SocialSharing)
{
	'use strict';

	return describe('SocialSharing Module', function ()
	{


		var application = SC.Application('SocialSharingTest')
		,	Layout = application.getLayout()
		,	is_started = false;

		beforeEach(function ()
		{
			application.Configuration = { 
				modules: [ 'SocialSharing' ]
			,	facebook: {
					enable: true
				}

			,	hover_pin_it_button: {
					enable_pin_it_hover: true
				}

			,	metaTagMappingOg: {
					'og:title': function () { return 'seo_title';}
				,	'og:url': function () { return 'seo_url';}
				,	'og:description': function () { return 'seo_description';}
				}

			,	metaTagMappingTwitterProductCard: {
					'twitter:card': function () { return 'seo_product';}
				}

			,	metaTagMappingTwitterGalleryCard: {
					'twitter:card': function () { return 'seo_gallery';}
				}

			,	addThis: {
					enable: true
				,	servicesToShow: {
						facebook: 'Facebook'
					,	twitter: 'Twitter'
					}
				}
			};
			jQuery(application.start(function () { 
				application.getLayout().appendToDom();
				is_started = true; 
			}));
			waitsFor(function() {
				return is_started; 
			});

		});

		/**
		 * TODO : Please implement this the right way
		 * refreshAddThisElements
		 */
		xit('refreshAddThisElements: Fills the share in add this place holder', function () 
		{
			var view = new Backbone.View({
				application: application
			});
			SC.templates.layout_tmpl = '<div id="content"></div>';
			SC.templates.socialSharing1_tmpl = '<div data-toggle="share-in-add-this"></div>'; 
			view.template = 'socialSharing1';
			view.showContent();

			window.addthis = {
				toolbox: jQuery.noop
			}; 

			Layout.refreshAddThisElements();

			expect(Layout.$('[data-toggle="share-in-add-this"]').html()).not.toBe('');
		});
		
		/**
		 * shareInMouseoverPinItButtonEventListener
		 */
		it('shareInMouseoverPinItButtonEventListener: Adds the pint it hover button functionality', function () 
		{
			var $image = jQuery('<div data-share-hover-pint-it-button="true"><img></div>')
			,	e = jasmine.createSpyObj('e', [ 'preventDefault' ])
			,	$pint_it_link;

			jQuery('body').append($image);			
			$pint_it_link = jQuery('.pin-it-link');
			expect($pint_it_link.length).toBe(0);

			Layout.shareInMouseoverPinItButtonEventListener = SocialSharing.shareInMouseoverPinItButtonEventListener;
			Layout.shareInMouseoverPinItButtonEventListener(e);
			expect(e.preventDefault).toHaveBeenCalled();

			$pint_it_link = jQuery('.pin-it-link');
			expect($pint_it_link.length).toBe(1);
		});



	});
});
