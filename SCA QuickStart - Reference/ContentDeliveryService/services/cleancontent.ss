var cds_cacheadmin;
if(!cds_cacheadmin) cds_cacheadmin = {};

cds_cacheadmin.util = function util(){

    this.pagesCacheName = 'cds_pages';
    this.pageContentsCacheName = 'cds_pagecontents';
    this.contentsCacheName = 'cds_contents';
    this.siteAndTagsCacheName = 'cds_siteandtags';
    this.defaultPagesCacheName = 'cds_defaultpages';
    this.tagNamesCacheName = 'cds_tagnames';

    this.logTitle = 'Content Delivery Bundle - Cache Admin';

    // public methods
    this.deleteKeyInCache = function(cacheName, key){
        try{
            var cache = nlapiGetCache(cacheName);

            if(key instanceof Array){
                for(var i = 0; i < key.length; i++){
                    cache.remove(key[i]);
                }
                nlapiLogExecution('DEBUG', this.logTitle, 'removed keys = [' + key.join(',') + '] in cache = ' + cacheName);
            }
            else{
                cache.remove(key);
                nlapiLogExecution('DEBUG', this.logTitle, 'removed key = ' + key + ' in cache = ' + cacheName);
            }
        }
        catch(e){
            nlapiLogExecution('DEBUG', this.logTitle, e);
        }
    };
};


function service(request,response){

    var contentID = request.getParameter('content_id');
    if(!parseInt(contentID,10)) {
        return;
    }

    var searchResults = nlapiSearchRecord(
        'customrecord_ns_cd_pagecontent',
        null,
        [new nlobjSearchFilter('custrecord_ns_cdpc_contentid',null,'is', contentID)],
        [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('custrecord_ns_cdpc_pageid'),
            new nlobjSearchColumn('custrecord_ns_cdpc_contentid')
        ]
    );

    var searchResults2 = nlapiSearchRecord(
        'customrecord_ns_cd_page',
        null,
        [new nlobjSearchFilter('custrecord_ns_cdp_mainbody',null,'is', contentID)],
        [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('custrecord_ns_cdp_mainbody')
        ]
    );




    var pcids = [];
    var contentIds = [];
    var pageIds = [];

    var lengths = (searchResults && searchResults.length) || 0;
    for(var i=0; i< lengths; i++)
    {
        pcids.push(searchResults[i].getValue('internalid'));
        contentIds.push(searchResults[i].getValue('custrecord_ns_cdpc_contentid'));
        pageIds.push(searchResults[i].getValue('custrecord_ns_cdpc_pageid'));
        // return true to keep iterating
    }

    var lengths2 = (searchResults2 && searchResults2.length) || 0;
    for(var j=0; j< lengths2; j++)
    {
        pageIds.push(searchResults2[j].getValue('internalid'));
        contentIds.push(searchResults2[j].getValue('custrecord_ns_cdp_mainbody'));
    }

    pcids = _.unique(pcids);
    contentIds = _.unique(contentIds);
    pageIds = _.unique(pageIds);

    var bll = new cds_cacheadmin.util();
    bll.deleteKeyInCache(bll.pageContentsCacheName, pcids);
    bll.deleteKeyInCache(bll.contentsCacheName, contentIds);
    bll.deleteKeyInCache(bll.pagesCacheName,pageIds);


    nlapiLogExecution('DEBUG', 'PAGECONTENTS', JSON.stringify(pcids));
    nlapiLogExecution('DEBUG', 'CONTENTIDS', JSON.stringify(contentIds));
    nlapiLogExecution('DEBUG', 'PAGEIDS', JSON.stringify(pageIds));
    /*
     ret.status = 'success';
     ret.description = 'deleted related caches for pageid ' + pageId;
     */
}