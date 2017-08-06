define('OrderWizard.Step.Ext', ['OrderWizard.Step'], function (OrderWizardStep) {

    // add normal header and footer in checkout
    _.extend(OrderWizardStep.prototype, {
        headerMacro: 'header',
        footerMacro: 'footer'
    });

});
