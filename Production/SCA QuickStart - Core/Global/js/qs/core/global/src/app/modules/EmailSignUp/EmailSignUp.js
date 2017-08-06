define('EmailSignUp',function(){

    var Model = Backbone.Model.extend({
        url: _.getAbsoluteUrl('services/email-sign-up.ss')
    });

    return{
        mountToApp: function(application){
            var Layout = application.getLayout();

            _.extend(Layout,{
                events: _.extend(Layout.events,{
                    'submit #email-sign-up-form':'emailSignUp'
                }),
                emailSignUp: function(e){
                    e.preventDefault();
                    var $form = jQuery(e.target),
                        email = _.escape($form.find('[name="email"]').val()),
                        isValidEmail = _.validateEmail(email),
                        config = application.getConfig('emailSignUp') || {},
                        response;

                    if (_.isNull(isValidEmail)) {
                        var model = new Model();
                        model.save(_.extend(config, {
                            email: email
                        }), {
                            success: function (model, r) {
                                response = SC.macros.message(r.successMessage, 'success', false);
                                $form.find('.alert-placeholder').html(response);
                                setTimeout(function(){
                                    $form.find('.alert-success').fadeOut()
                                },3000);
                            },
                            error: function (model, r) {
                                response =  SC.macros.message(r.responseText, 'error', true);
                                $form.find('.alert-placeholder').html(response);
                            }
                        });
                    } else {
                        response = SC.macros.message(isValidEmail, 'error', true);
                        $form.find('.alert-placeholder').html(response);
                    }

                }
            })
        }
    }
});