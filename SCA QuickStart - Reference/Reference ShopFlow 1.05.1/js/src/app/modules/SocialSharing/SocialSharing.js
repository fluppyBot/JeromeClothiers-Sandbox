// SocialSharing.js
// ----------------
// Provides standalone social sharing icons
// Handles the integration with ShareThis

/*global FB:true*/

define('SocialSharing', ['ItemDetails.View', 'Facets.Views'], function (ItemDetailsView, FacetsViews)
{
	/*jshint validthis:true*/
	'use strict';

	var facebook_script_loaded = false
	,	addthis_script_loaded = false; 

	// getSocialAttributes:
	// get Social attributes from the dom
	function getSocialAttributes (dom_selectors)
	{
		var result = {url: document.location.href};
		
		// we extend dom_selectors with some default selectors
		// if already defined, they don't get overriden
		dom_selectors = _.extend({
			description: '[data-type="social-description"]'
		,	images: '[data-type="social-image"]'
		,	image: '[data-type="lead-social-image"]'
		}, dom_selectors);
		
		// Looks for the description in the dom
		if (this.$(dom_selectors.description).length)
		{
			result.description = jQuery.trim(this.$(dom_selectors.description).text());
		}
		
		// Some social media services support several images
		if (this.$(dom_selectors.images).length)
		{
			result.images = _.map(this.$(dom_selectors.images), function ()
			{
				return this.src;
			});
		}
		
		// You can allways set a lead image
		if (this.$(dom_selectors.image).length)
		{
			result.image = this.$(dom_selectors.image).get(0).src;
		}
		// if there is none, we try to get the first one from images
		else if (result.images && result.images.length)
		{
			result.image = result.images[0];
		}
		
		return result;
	}
	
	// getPopupOptionsStringFromObject:
	// {translates: "this", to: ""} to translates=this,to=
	function getPopupOptionsStringFromObject (popup_options)
	{
		var popup_options_string = '';
		
		_.each(popup_options, function (value, name)
		{
			popup_options_string += ','+ name +'='+ value;
		});

		// the substring is to get rid of the leading coma
		return popup_options_string.substring(1);
	}
	
	// shareInMouseoverPinItButtonEventListener
	function shareInMouseoverPinItButtonEventListener (e)
	{
		e.preventDefault();

		if (this.getApplication().getConfig('hover_pin_it_button.enable_pin_it_hover')) {
			jQuery('.pin-it-link').remove();

			// button hover pin-it-link
			// hidden-phone hidden-tablet because of the interaction on desktop with hover (phone and tablet always hidden)
			jQuery('[data-share-hover-pint-it-button="true"] img')
				.after('<a class="pin-it-link hidden-phone hidden-tablet" data-share-click-pint-it-button="true"></a>');
		}
	}
	
	// shareInClickPinItButton: 
	// opens a new window to share the page in Pintrest
	// based on some configuration options
	function shareInClickPinItButton (url, image, title)
	{
		var popup_options_string = getPopupOptionsStringFromObject(this.getConfig('hover_pin_it_button.popupOptions'))
		,	target_url = 'http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(url) + '&media=' + encodeURIComponent(image) + '&description=' + encodeURIComponent(title);
		
		window.open(target_url, _.uniqueId('window'), popup_options_string );
	}
	
	// shareInClickPinItButtonEventListener:
	// calls shareInClickPinItButton method passing the configuration options
	function shareInClickPinItButtonEventListener (e)
	{
		e.preventDefault();
		if (!this.getApplication().getConfig('hover_pin_it_button.enable_pin_it_hover') && !this.getApplication().getConfig('hover_pin_it_button.enable_pin_it_button'))
		{
			return;
		}

		var self = this
		,	image_size = self.getApplication().getConfig('hover_pin_it_button').image_size
		,	metaTagMappingOg = self.getApplication().getConfig('metaTagMappingOg')
		,	url = metaTagMappingOg['og:url'](self, 'pinterest')
		,	image = jQuery('a.bx-pager-link.active').find('img').attr('src') // selected image
		,	title = metaTagMappingOg['og:title'](self, 'pinterest');

		if (!image){
			image = jQuery('.item-detailed-image').find('img').attr('src');
		}

		image = self.getApplication().resizeImage(image.split('?')[0], image_size);

		self.getApplication().shareInClickPinItButton(url, image, title);
	}
	
	// shareInPinterest:
	// opens a new window to share the page in Pinterest
	// based on some configuration options
	function shareInPinterest (url, image, description, popup_options)
	{
		var popup_options_string = getPopupOptionsStringFromObject(popup_options || this.getConfig('pinterest.popupOptions'))

		,	target_url = 'http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(url) + '&media=' + encodeURIComponent(image) + '&description=' + encodeURIComponent(description);
		
		window.open(target_url, _.uniqueId('window'), popup_options_string );
	}
	
	// shareInPinterestEventListener:
	// calls shareInPinterest method passing the configuration options
	function shareInPinterestEventListener (e)
	{
		e.preventDefault();
		
		var metaTagMappingOg = this.getApplication().getConfig('metaTagMappingOg')
		,	url = metaTagMappingOg['og:url'](this, 'pinterest')
		,	image = metaTagMappingOg['og:image'](this, 'pinterest')
		,	description = metaTagMappingOg['og:description'](this, 'pinterest');
		
		this.Application.shareInPinterest(url, image, description);
	}
	
	// shareInTwitter:
	// opens a new window to share the page in Twitter
	// based on some configuration options
	function shareInTwitter (url, description, via, popup_options)
	{
		var popup_options_string = getPopupOptionsStringFromObject(popup_options || this.getConfig('twitter.popupOptions'))
		,	target_url = 'https://twitter.com/intent/tweet?original_referer='+ encodeURIComponent(url) +'&source=tweetbutton&text='+ encodeURIComponent(description) +'&url='+ encodeURIComponent(url) +'&via='+ encodeURIComponent(via);
		
		window.open(target_url, _.uniqueId('window'), popup_options_string);
	}
	
	// shareInTwitterEventListener: 
	// calls shareInTwitter method passing the configuration options
	function shareInTwitterEventListener (e)
	{
		e.preventDefault();

		var metaTagMappingOg = this.getApplication().getConfig('metaTagMappingOg')
		,	url = metaTagMappingOg['og:url'](this, 'twitter')
		,	title = metaTagMappingOg['og:title'](this, 'twitter')
		,	via = this.getApplication().getConfig('twitter.via').replace('@', '');
		
		this.Application.shareInTwitter(url, title, via);
	}
	
	// refreshFacebookElements:
	// re-writes the DOM of the facebook elements
	function refreshFacebookElements ()
	{
		var buttons = this.$('[data-toggle="like-in-facebook"]'); 

		// don't make any calculations if there are no placeholders or facebook is not enabled.
		if (!buttons.size() || typeof FB === 'undefined')
		{
			return;
		}
		var	metaTagMappingOg = this.getApplication().getConfig('metaTagMappingOg')
		,	pluginOptions = this.getApplication().getConfig('facebook.pluginOptions')
		,	url = metaTagMappingOg['og:url'](this, 'facebook');
		
		buttons.empty();
		
		var attr = {
			'href': url
		,	'data-href': url
		};
		
		_.each(pluginOptions, function (value, name)
		{
			attr['data-'+ name] = value;
		});
		
		buttons.attr(attr).addClass('fb-like');
		
		FB.XFBML.parse();
	}
	// shareInGooglePlus: 
	// opens a new window to share the page in Google+
	// based on some configuration options
	function shareInGooglePlus (url, popup_options)
	{
		var popup_options_string = getPopupOptionsStringFromObject(popup_options || this.getConfig('googlePlus.popupOptions'))
		,	target_url = 'https://plus.google.com/share?url=' + encodeURIComponent(url);
		
		window.open(target_url, _.uniqueId('window'), popup_options_string );
	}
	
	//  shareInGooglePlusEventListener: 
	// calls shareInGooglePlus method passing the configuration options
	function shareInGooglePlusEventListener (e)
	{
		e.preventDefault();
		var metaTagMappingOg = this.getApplication().getConfig('metaTagMappingOg')
		,	url = metaTagMappingOg['og:url'](this, 'google-plus');
		
		this.Application.shareInGooglePlus(url);
	}

	var meta_tag = {};
	
	
	/**
	 * setMetaTags: Based on the meta tags config, 
	 */
	function setMetaTags ()
	{
		var self = this
		,	application = this.getApplication()
		,	current_view = application.getLayout().currentView
		,	meta_tag_mapping_og = application.getConfig('metaTagMappingOg')
		,	meta_tag_mapping_twitter_productCard = application.getConfig('metaTagMappingTwitterProductCard')
		,	meta_tagMapping_twitter_gallery_card = application.getConfig('metaTagMappingTwitterGalleryCard');

		clearMetaTagsByConfiguration(meta_tag_mapping_og);
		clearMetaTagsByConfiguration(meta_tag_mapping_twitter_productCard);
		clearMetaTagsByConfiguration(meta_tagMapping_twitter_gallery_card);

		if (current_view instanceof ItemDetailsView)
		{
			setMetaTagsByConfiguration(self, meta_tag_mapping_og);
			setMetaTagsByConfiguration(self, meta_tag_mapping_twitter_productCard);
		}
		else if (current_view instanceof FacetsViews.Browse)
		{
			setMetaTagsByConfiguration(self, meta_tagMapping_twitter_gallery_card);
		}
	}

	/**
	 * setMetaTagsByConfiguration:
	 */
	function setMetaTagsByConfiguration (self, meta_tag_configuration) {
		_.each(meta_tag_configuration, function (fn, name)
		{
			var value = fn(self);
			
			if (!meta_tag[name])
			{
				if (jQuery('meta[name="'+name+'"]').length)
				{
					meta_tag[name] = jQuery('meta[name="'+name+'"]');
				}
				else
				{
					meta_tag[name] = jQuery('<meta />', {name: name});
					jQuery('head').append(meta_tag[name]);
				}
			}
			meta_tag[name].attr('content', value || '');
		});
	}

	/**
	 * clearMetaTagsByConfiguration
	 */
	function clearMetaTagsByConfiguration (meta_tag_configuration) {
		var $meta_tag = '';
		
		_.each(meta_tag_configuration, function (fn, name)
		{
			$meta_tag = jQuery('meta[name="'+name+'"]');
			if ($meta_tag.length)
			{
				$meta_tag.attr('content', '');
			}
		});
	}
	
	// refreshAddThisElements
	// The plugin of "Add this" expects a very strict html and a function of their plugin
	//  needs to be called every time a new page is displayed, we do this here
	function refreshAddThisElements ()
	{	
		if (!window.addthis || !jQuery('[data-toggle="share-in-add-this"]').size())
		{
			return;
		}

		var Configuration = this.getApplication().getConfig()
		,	metaTagMappingOg = this.getApplication().getConfig('metaTagMappingOg')
		,	innerHTML = '';

		_.each(Configuration.addThis.servicesToShow, function (name, code)
		{
			innerHTML += '<a class="addthis_button_'+code+'">'+ name +'</a>';
		});
		
		var share_options = {
			url: metaTagMappingOg['og:url'](this, 'add-this')
		,	title: metaTagMappingOg['og:title'](this, 'add-this')
		,	description: metaTagMappingOg['og:description'](this, 'add-this')
		};
		
		jQuery('[data-toggle="share-in-add-this"]').each(function ()
		{
			if (this)
			{
				var $this = jQuery(this);
				$this.html(innerHTML).addClass(Configuration.addThis.toolboxClass);
				window.addthis.toolbox(this, Configuration.addThis.options, share_options);
			}
		});
	}
	
	var social_sharing = {
		setMetaTags: setMetaTags
	,	refreshAddThisElements: refreshAddThisElements
	,	shareInMouseoverPinItButtonEventListener: shareInMouseoverPinItButtonEventListener
	,	mountToApp: function (Application)
		{
			var Layout = Application.getLayout()
			,	Configuration = Application.getConfig();
						
			// This functions could be triggered by anyone, so we put them in the app level
			_.extend(Application, {
				shareInClickPinItButton: shareInClickPinItButton
			,	shareInPinterest: shareInPinterest
			,	shareInTwitter: shareInTwitter
			,	shareInGooglePlus: shareInGooglePlus
			});
			
			// This are mostly related to the dom, or to events, so we add them in the layout
			_.extend(Layout, {
				getSocialAttributes: getSocialAttributes
			,	shareInMouseoverPinItButtonEventListener: shareInMouseoverPinItButtonEventListener
			,	shareInClickPinItButtonEventListener: shareInClickPinItButtonEventListener
			,	shareInPinterestEventListener: shareInPinterestEventListener
			,	shareInTwitterEventListener: shareInTwitterEventListener
			,	refreshFacebookElements: refreshFacebookElements
			,	shareInGooglePlusEventListener: shareInGooglePlusEventListener
			,	setMetaTags: setMetaTags
			,	refreshAddThisElements: refreshAddThisElements
			});
			
			// add event listeners
			Layout.delegateEvents({
				'click [data-toggle=share-in-pinterest]': 'shareInPinterestEventListener'
			,	'click [data-toggle=share-in-twitter]': 'shareInTwitterEventListener'
			,	'click [data-toggle=share-in-google-plus]': 'shareInGooglePlusEventListener'
			});

			// extend Layout and add event listeners
			_.extend(Layout.events, {
				'mouseover [data-share-hover-pint-it-button="true"]': 'shareInMouseoverPinItButtonEventListener'
			,	'click [data-share-click-pint-it-button="true"]': 'shareInClickPinItButtonEventListener'
			});
			
			Layout.on('afterAppendView', function ()
			{
				// Everytime a new view is appended, if you have placed an element with 
				// data-toggle=social-share-icons attribute we will render the macro here
				this.$('[data-toggle="social-share-icons"]').each(function (index, element)
				{
					jQuery(element).html(SC.macros[Configuration.socialSharingIconsMacro](Configuration));
				});
				
				// check if facebook script isn't already loaded and if there is an actual placeholder on where to load it
				if (!facebook_script_loaded && Configuration.facebook.enable && jQuery('[data-toggle="like-in-facebook"]').size())
				{
					var facebook_script_url = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'connect.facebook.net/en_US/all.js#xfbml=1&appId='+ Configuration.facebook.appId; 
					// avoid on SEO and start facebook library
					(SC.ENVIRONMENT.jsEnvironment === 'browser') && jQuery.getScript(facebook_script_url, function ()
					{
						if (typeof FB !== 'undefined')
						{
							facebook_script_loaded = true;
							FB.init();
							Layout.refreshFacebookElements();
						}
					});
				}

				// check if addthis script isn't already loaded and if there is an actual placeholder on where to load it
				if (!addthis_script_loaded && Configuration.addThis.enable && jQuery('[data-toggle="share-in-add-this"]').size())
				{
					var addthis_script_url = ('https:' === document.location.protocol ? 'https://' : 'http://') + 's7.addthis.com/js/300/addthis_widget.js#domready=1';
					// avoid on SEO and start addthis library
					(SC.ENVIRONMENT.jsEnvironment === 'browser') && jQuery.getScript(addthis_script_url, function ()
					{
						addthis_script_loaded = true;
						Layout.refreshAddThisElements();
					});
				}
				
				// Then Facebook and addthis plugins are called
				Layout.refreshFacebookElements();
				Layout.refreshAddThisElements();
				
				// Then we set the meta tags
				Layout.setMetaTags();
			});

		}
	};

	return social_sharing;
});
