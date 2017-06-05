/* global CMS: false */
/**
 *	CMSadapter
 *	@summary Allows a SCA app to get content & interact with the CMS.
 *	@copyright (c) 2000-2014, NetSuite Inc.
 *
 *	NOTE: Assuming the main SCA app has included Underscore.js and left it on the global window object (Just like other SCA modules).
 */

define('CMSadapter'
,	['jquery','Merchandising.ItemCollection', 'Merchandising.Zone', 'Merchandising.Context']
,	function ($, MerchandisingItemCollection, MerchandisingZone, MerchandisingContext)
{
	'use strict';

	var CMSMerchandisingZone = function (element, options)
	{
		var application = options && options.application
		,	layout = application && application.getLayout && application.getLayout()
		,	items_url = decodeURIComponent(options.fields.clob_merch_rule_url)
		,	CMSMerchandisingItemCollection = MerchandisingItemCollection.extend({url: items_url})
		,	exclude = [];

		if (options.fields.boolean_exclude_current)
		{
			exclude.push('$current');
		}

		if (options.fields.boolean_exclude_cart)
		{
			exclude.push('$cart');
		}

		if (!element || !layout)
		{
			return;
		}

		this.$element = jQuery(element).empty();

		// Convert CMS data into SCA Merchandising models
		this.model = new Backbone.Model(options);
		this.model.set('show', options.fields.number_merch_rule_count || 100);
		this.model.set('exclude', exclude);
		this.model.set('template', options.fields.string_merch_rule_template);
		this.model.set('description', options.desc);

		this.options = options;
		this.application = application;
		this.items = new CMSMerchandisingItemCollection();
		this.context = new MerchandisingContext(layout.modalCurrentView || layout.currentView || layout);

		this.initialize();
	};

	_.extend(CMSMerchandisingZone.prototype, MerchandisingZone.prototype, {
		//We override the initialize method to NOT generate the URL from the model, as the URL is already calculate from the CXM code
		initialize: function ()
		{
			this.addLoadingClass();
			// the listeners MUST be added before the fetch occurs
			this.addListeners();

			// fetch the items
			this.items.fetch({
				cache: true
			});
		}
	});

	var startup_cms_load_done = false
	,	adapter_config = {
			IMAGE_CONTENT_DEFAULT_TEMPLATE: 'image_default'
		}
		// NOTE: Not polyfilling the addEventListener & removeEventListener methods in the browser
		// so libs like jQuery will continue to work without issue in legacy IE.
	,	ie_prop_listeners = {}
	,	addEventListener = function (type, callback)
		{
			var prop_fn = function (e)
				{
					if (e.propertyName === type)
					{
						callback();
					}
				};
			// Modern browsers have addEventListener.
			if (document.addEventListener)
			{
				document.addEventListener(type, callback);
			// IE5-8 handled here.
			// The cms will update a property with the same name as the event on the documentElement.
			}
			else if (document.attachEvent)
			{
				document.documentElement.attachEvent('onpropertychange', prop_fn);
				ie_prop_listeners[type] = prop_fn; // Keep track of our new function for removal later.
			}
		}
	,	removeEventListener = function (type, listener)
		{
			if (document.removeEventListener)
			{
				document.removeEventListener(type, listener);
			}
			else if (document.detachEvent)
			{
				if (ie_prop_listeners[type])
				{
					document.documentElement.detachEvent('onpropertychange', ie_prop_listeners[type]);
				}
				ie_prop_listeners[type] = null;
			}
		}

	,	CMSadapter = {
			// App start
			mountToApp: function (Application)
			{
				var self = this
				,	readyHandler = function ()
					{
						removeEventListener('cms:ready', readyHandler);
						CMS.api.setApplication(Application);
						self.start(self.application);
					};

				self.application = Application;

				Application.getLayout().on('afterAppendView', function ()//(view)
				{
					// CMS start
					if (typeof CMS !== 'undefined' && CMS.api && CMS.api.is_ready())
					{
						readyHandler();
					}
					else
					{
						addEventListener('cms:ready', readyHandler);
					}
				});
			}
			// Start - listen for events
		,	start: function (Application)
			{
				var self = this
				,	loadHandler = function ()
					{
						removeEventListener('cms:load', loadHandler);
						startup_cms_load_done = true;
						self.getPage();
					};

				// Initial load
				if (CMS.api.has_loaded())
				{
					loadHandler();
				}
				else
				{
					addEventListener('cms:load', loadHandler);
				}

				// ==================
				// App listeners
				// =====================
				// App events:
				// beforeStart
				// afterModulesLoaded
				// afterStart

				// afterAppendView fires when html is added to the page. Usually when a user has navigated to another page. But can also fire on things like modals for the "quick look" on products.
				// This is the only event we have currently to know that SCA might have loaded a page.
				// We wait until startup_cms_load_done is true before really listening to afterAppendView requests. This prevents extra requests during page startup due to race-conditions/timing of SCA and CMS.
				Application.getLayout().on('afterAppendView', function ()//(view)
				{
					// Adapter needs to get new content in case it was a page load that happened.
					// This is outside of the cms on purpose. When a normal user is not authenticated, the website still needs to get content.
					if (startup_cms_load_done)
					{
						// 'AFTER APPENDVIEW GET PAGE'
						self.getPage();

						// let the cms know
						CMS.trigger('adapter:page:changed');
					}
				});

				// ==================
				// CMS listeners - CMS tells us to do something, could fire anytime
				// =====================

				CMS.on('cms:get:setup', function ()
				{
					// default values the cms needs upon startup
					var setup = {
						site_id: SC.ENVIRONMENT.siteSettings.id
					};

					CMS.trigger('adapter:got:setup', setup);
				});

				CMS.on('cms:new:content', function (content)
				{
					// A content model is provided, and should be rendered on the current page.
					var context = _.findWhere(content.context, {id: content.current_context})
					,	sequence = context.sequence
					,	area = $('[data-cms-area="'+context.area+'"]')
					,	children = area.children().not('.ns_ContentDropzone')
						// NOTE: Currently, all new content should be blank by default
					,	new_html = '<div class="'+ self.generateContentHtmlClass(content) +'" id="'+ self.generateContentHtmlID(content) +'">'+ self.renderContentByType(content, true) +'</div>';

					// TODO: Any need to verify context matches current page context (from sca)? Should always match but do we need to check?

					// insert at proper index, assuming only children of area can be "content",
					// even if they have been wrapped with new html (by cms internal code) it's safe to still inject based on index
					if (sequence === 0 || children.length === 0)
					{
						area.prepend(new_html);
					}
					else if (sequence > (children.length - 1))
					{
						area.append(new_html);
					}
					else
					{
						children.eq(sequence).before(new_html);
					}

					CMS.trigger('adapter:rendered'); // let CMS know we're done
				});

				// Re-render an existing piece of content. Changing only the content values, NOT creating/re-creating the cms-content wrapper divs.
				CMS.on('cms:rerender:content', function (content)
				{
					var selector = self.generateContentHtmlID(content, true)
					,	html_content = self.renderContentByType(content, true);

					if (html_content)
					{
						$(selector).html(html_content);
					}
					CMS.trigger('adapter:rendered');
				});

				CMS.on('cms:get:context', function ()
				{
					var context = self.getPageContext();
					CMS.trigger('adapter:got:context', context);
				});

				// This is for times when the CMS is telling the adapter to re-render the page, even though the adapter did not initiate the request for page data
				CMS.on('cms:render:page', function (page)
				{
					self.renderPageContent(page);
				});

				// ==================
				// END CMS listeners
				// =====================

				// ADAPTER TRIGGERED READY.
				CMS.trigger('adapter:ready');
			}

		,	renderPageContent: function (page)
			{
				var self = this;
				$.each(page.areas, function (indx, area)
				{
					var selector = '[data-cms-area="'+ area.name +'"]'
					,	ele_string = '';

					// build html string for all content in the area
					$.each(area.contents, function (sub_indx, content)
					{
						// Start new content div.
						ele_string += '<div class="'+ self.generateContentHtmlClass(content) +'" id="'+ self.generateContentHtmlID(content) +'">';
						ele_string += self.renderContentByType(content);
						ele_string += '</div>'; // Close new content div.
					});

					// inject content
					$(selector).html(ele_string);
				});
				CMS.trigger('adapter:rendered');
			}

		,	renderContentByType: function (content, is_edit_preview)
			{
				if (typeof is_edit_preview !== 'boolean')
				{
					is_edit_preview = false;
				}

				var self = this
				,	content_type = content.type
				,	trimmed_text_content
				,	content_html = '';

				switch (content_type)
				{
					case 'TEXT':
						trimmed_text_content = $.trim(content.fields.clob_html);
						if (trimmed_text_content !== '')
						{
							content_html = trimmed_text_content;
						}
					break;
					case 'IMAGE':
						if (content.fields.string_src)
						{
							content_html = SC.macros[adapter_config.IMAGE_CONTENT_DEFAULT_TEMPLATE](content);
						}
					break;
					case 'MERCHZONE':
					// NOTE: merchzone doesn't set content_html. Instead an Ajax call is made to fill in content later.
						if (content.fields.clob_merch_rule_url)
						{
							// Call items api.
							// NOTE: It's OK to use fields.clob_merch_rule_url here instead of making an additional request for merchzone data because this value should be the latest available when merchzone content is being edited.
							if (is_edit_preview)
							{
								var element_selector = self.generateContentHtmlID(content, true);
								//The creation of the CMS merchandising will take care of the entire rendering

								new CMSMerchandisingZone(element_selector, _.extend({application: self.application}, content));
							}
							else
							{
								// NOTE: We need the most currently available items api URL (so we get merchzone data), can't rely on content.fields.clob_merch_rule_url, it could be old (and we only use that for preview when editing anyway).
								CMS.api.getMerchzone({
									merch_rule_id: content.fields.number_merch_rule_id
								,	success: function (zone)
									{
										if (zone && zone.merch_zone && !zone.merch_zone.is_inactive && zone.merch_zone.is_approved && zone.merch_zone.query_string )
										{
											var element_selector = self.generateContentHtmlID(content, true);
											//The creation of the CMS merchandising will take care of the entire rendering
											//Pass the current application, the content that contains which items to exclude, and the zone that contains its name and description

											new CMSMerchandisingZone(element_selector, _.extend({application: self.application}, content, zone.merch_zone));

										// If the rule was set to inactive after it was placed on the page we need to clear out the content rule URL.
										}
										else if (zone.merch_zone.is_inactive || !zone.merch_zone.is_approved)
										{
											content.fields.clob_merch_rule_url = undefined;
										}
									}
								});
							}
						}
					break;
					default:
						// do nothing
				}

				return content_html;
			}

		,	generateContentHtmlClass: function (content, include_dot)
			{
				return (include_dot ? '.': '') + 'cms-content cms-content-'+ content.type.toLowerCase();
			}
		,	generateContentHtmlID: function (content, include_hash)
			{
				return (include_hash ? '#': '') + 'cms-content-'+ content.id +'-'+ content.current_context;
			}
		,	getPage: function ()
			{
				var self = this;
				// CMS requests
				// get current page's content on load
				CMS.api.getPage({
					page: self.getPageContext()
				,	success: function (page)
					{
						self.renderPageContent(page);
					}
				,	error: function ()
					{

					}
				});
			}
			//@method getPageContext
		,	getPageContext: function ()
			{
				// returning a new object every-time, so no need to clone
				return {
					site_id: SC.ENVIRONMENT.siteSettings.id
				,	path: window.location.pathname
				,	page_type: this.application.getLayout().currentView.el.id
				};
			}
		};
	// NOTE: outside of mount to app and the CMSadapter class! - will run as soon as requirejs loads module
	return CMSadapter;
});
