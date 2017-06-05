define('Home.Extensions', ['Home'], function(Home){

    _.extend(Home.View.prototype, {

        jQuerify: function(elem) {
            return (elem instanceof jQuery? elem : (typeof elem === 'string')? this.$(elem) : jQuery(elem));
        },

        setupSlider: function(elem, options) {
            return this.jQuerify(elem).bxSlider(_.extend({
                responsive: true,
                controls: true,
                preloadImages: 'visible',
                autoControlsCombine: true,
                autoHover: true,
                useCSS: false
            }, options || {}));
        },

        getMerchZoneLoadedPromise: function (merchZone) {
            return this.jQuerify(merchZone).data('merchandising-zone').promise;
        },
        setupMerchSlider: function(merchZone, slider, options, container) {
            var self = this,
                promise = self.getMerchZoneLoadedPromise(merchZone) || jQuery.Deferred().resolve();
            return promise.done(function(){
                self.setupSlider(slider, options);
            }).fail(function() {
                if(container) {
                    self.jQuerify(container).addClass('hide');
                }
            });
        }

    });

    return {

        mountToApp: function(application) {

            var Layout = application.getLayout();

            Layout.on('renderEnhancedPageContent', function(view, content) {
                if(view instanceof Home.View) {

                    if(content.target === '#home-slider') {
                        view.setupSlider(content.target, {
                            slideMargin: 0,
                            autoStart: true,
                            controls: false,
                            nextSelector: null,
                            prevSelector: null,
                            auto: true,
                            pause: 5000
                        });
                    }
                }
            });

            Layout.on('afterAppendView', function(view) {
                
                console.log('xyla :)')
                
                if(view instanceof Home.View) {

                    // Add Class for home-page
                    jQuery('#layout').addClass('home-page');
                    view.$('[data-type="merchandising-zone"]').each(function() {

                        var $this = jQuery(this);
                        if($this.data('id') === 'home-merchandising') {

                           view.setupMerchSlider($this, '.home-merchandising .merchandising-slider', {
                                pager: true,
                                minSlides: 1,
                                maxSlides: 4,
                                slideWidth: 300,
                                slideMargin: 10
                            }, '.home-merchandising');
                        }
                    });
                    
                    jQuery('.quick-button-area').addClass('home');

                } else {
                    jQuery('#layout').removeClass('home-page');
                }
            });

        }

    };

});
