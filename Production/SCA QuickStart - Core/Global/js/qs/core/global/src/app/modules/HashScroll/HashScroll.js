define('HashScroll', function() {

    'use strict';

    return {
        /* settings */
        paramName: 'target',
        animated: true,

        mountToApp: function(application, options) {

            var param_name = this.paramName,
                animated = this.animated;
            if(options) {
                if(options.paramName) {
                    param_name = options.paramName;
                }
                if('animated' in options) {
                    animated = options.animated;
                }
            }

            var Layout = application.getLayout();

            Layout.on('afterAppendView', function () {
                var url_options = _.parseUrlOptions(Backbone.history.fragment),
                    param = url_options[param_name];

                if(param) {
                    var $target = Layout.$('#'+param);
                    if(!$target.length) {
                        $target = Layout.$('[name="'+param+'"]');
                    }
                    if($target.length) {
                        setTimeout(function() {
                            var offset = $target.offset().top;
                            if(animated) {
                                jQuery('html, body').animate({ scrollTop: offset }, 500);
                            } else {
                                jQuery('html, body').scrollTop(offset);
                            }
                        }, 0);
                    }
                }
            });

        }
    };

});