function service(request, response) {
    try {
        var params = JSON.parse(request.getBody());

        params.email = escape(params.email);
        params.firstname = 'firstname';
        params.lastname = 'lastname';

        var url = 'https://'+params.domain+'/app/site/crm/externalleadpage.nl?compid='+nlapiGetContext().getCompany()+'&formid='+params.formId+'&h='+params.hash;

        nlapiRequestURL(url, params);
        response.setContentType('json');
        response.write(JSON.stringify({ successMessage: 'Thanks for signing up for our newsletter!' }));
    } catch(exception) {
        nlapiLogExecution('ERROR', 'Newsletter Signup Error', exception);
        response.write(exception);
    }
}
