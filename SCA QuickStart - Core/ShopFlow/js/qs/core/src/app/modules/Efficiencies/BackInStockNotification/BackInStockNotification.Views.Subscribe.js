define('BackInStockNotification.Views.Subscribe', ['BackInStockNotification.Model'], function (Model)
{
    'use strict';

    return Backbone.View.extend({
        template: 'backinstocknotification_subscribe',
        attributes: {'class': 'dropdown bis'},
        events: {
            'click [data-action="show-bis-control"]': 'toggleBisControl',
            'submit form': 'saveForm'
        },
        initialize: function(options)
        {
            this.itemModel = options.itemModel;
            this.application = options.application;
            jQuery(document).click(this.outsideClickEvent);
            this.setNewModel();
        },
        setNewModel: function(){
            this.model = new Model();
            this.model.set('item',this.itemModel);
        },
        outsideClickEvent: function(event)
        {
            if (jQuery(event.target).parents().index(jQuery(event.target).closest('[data-type^="bis-control"]')) === -1 && jQuery(event.target).attr('class') && jQuery(event.target).attr('class').indexOf('bis-control') === -1)
            {
                if(jQuery('[data-type="bis-control"]').is(':visible'))
                {
                    var $control = jQuery('[data-type="bis-control"]');
                    $control.slideUp();
                }
            }
        },
        toggleBisControl: function ()
        {
            // Check if the user is logged in
            var $control = this.$('[data-type="bis-control"]');
            if ($control.is(':visible'))
            {
                $control.slideUp();
            }
            else
            {
                $control.slideDown();
            }
        },
        render: function ()
        {
            // if the control is currently visible then we remember that !
            this.is_visible = this.$('[data-type="bis-control"]').is(':visible');
            Backbone.View.prototype.render.apply(this);
        },
        shouldRender: function()
        {

        },
        destroy: function()
        {
            jQuery(document).unbind('click',this.outsideClickEvent);
            Backbone.View.prototype.destroy.apply(this);
        },
        saveForm: function (e)
        {
            e.preventDefault();
            this.$('[data-confirm-bin-message]').empty()

            var self = this;
            var promise = Backbone.View.prototype.saveForm.apply(this, arguments);

            promise && promise.error(function(jqXhr){
                jqXhr.preventDefault = true;
                self.showErrorMessage(jqXhr.responseJSON.errorMessage);
            });

            return promise && promise.done(function ()
            {
                self.setNewModel();
                self.render();
                self.showConfirmationMessage(_('Success!!').translate());
                self.$('[data-type="bis-control"]').slideUp(1000);
            });

        },
        showErrorMessage: function(message){

            var $confirmation_message = this.$('[data-confirm-bin-message]')
                ,	$msg_el = jQuery(SC.macros.message(message, 'error', true));

            $confirmation_message.show().empty().append($msg_el);
            setTimeout(function()
            {
                $confirmation_message.fadeOut(1000);
            }, 5000);
        },
        showConfirmationMessage: function (message)
        {
            this.confirm_message = message;
            var $confirmation_message = this.$('[data-confirm-bin-message]')
                ,	$msg_el = jQuery(SC.macros.message(message, 'success', true));

            this.confirm_message = message;
            $confirmation_message.show().empty().append($msg_el);

            setTimeout(function()
            {
                $confirmation_message.fadeOut(1000);
            }, 5000);
        },
        getSelectedProduct: function()
        {
            if (this.itemModel.getPosibleOptions().length)
            {
                var selected_options = this.itemModel.getSelectedMatrixChilds();

                if (selected_options.length === 1)
                {
                    return selected_options[0].get('internalid') + '';
                }
            }

            return this.itemModel.get('_id') + '';
        }
    });
});