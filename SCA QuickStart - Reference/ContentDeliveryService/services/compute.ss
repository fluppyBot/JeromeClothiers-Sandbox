function service(request, response){
	try {		
		var method = request.getMethod(),
			pageId = request.getParameter('pageId'),
			tags = request.getParameter('tags'),
			data = JSON.parse( request.getBody() || '{}' );	
		
		var Content = Application.getModel('Content');		
		switch ( method ) {
			case 'GET': 
				Application.sendContent(Content.compute(pageId, tags) || []);
				break;			
			default: 
				Application.sendError( methodNotAllowedError );		
		}
	}
	catch(e){
		Application.sendError( e );
	}
}