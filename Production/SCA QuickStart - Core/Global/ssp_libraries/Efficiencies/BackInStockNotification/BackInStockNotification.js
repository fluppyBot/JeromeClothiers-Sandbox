//TODO: Change name to BackInStockNotification.Currency
/*
Currencies are searchable but the field displaysimbol (that contains $ or Euro sign for example) is not a column.
So we have to load records
Also, there is the problem with currency-locales, the way the currency gets written in native locale (see config for details)
Locale is not a record in ns, so we have to merge the config by hand
 */
Application.defineModel('BackInStockNotificationCurrency', {
    record: 'currency',
    fields: {
        symbol: { fieldName: 'symbol'},
        displaysymbol: { fieldName: 'displaysymbol'}
    },
    get: function(id){
        var search = new RecordHelper(this.record,this.fields);
        return search.get(id).getResult();
    },
    list: function(ids,appendLocaleInfo){

        //Had to be done by LOAD RECORD because of displaysymbol access :( (Not available on searches)
        var search = new RecordHelper(this.record,this.fields);
        var results = search.search(ids).getResults();

        //Locale info had to be appended by hand as there is no way to get the relationship between the locale and the currency
        //However, i'm 80% sure behind the curtains, there is a relatinship and that's what is taken into account on the website
        //in order to show prices with commas or periods
        //Also locale is not even a record on NS
        if(appendLocaleInfo)
        {
            _.each(results, function(result){
                var j = result;
                var cmd = SC.Configuration.Efficiencies.BackInStockNotification.localecurrency_metadata;
                var conf = _.findWhere(SC.Configuration.Efficiencies.BackInStockNotification.localecurrency_metadata, {currency: result.internalid});
                if(conf) {
                    result.locale_metadata = conf.locale_metadata;
                }
            });
        }
        return results;
    }
});





/*
Register customer Functionality
*/

Application.defineModel('BackInStockNotificationCustomer', {
    record: 'customer',
    columns: {
        internalid: {fieldName: 'internalid'},
        email : {fieldName: 'email'},
        isinactive: {fieldName: 'isinactive'},
        language: {fieldName: 'language'},
        currency: {fieldName: 'currency'},
        giveaccess: {fieldName: 'giveaccess'},
        subsidiary: {fieldName: 'subsidiary'}
    },
    fieldsets: {
        duplicated: ['internalid','email','isinactive','language','currency']
    },
    filters : {
        base: [{fieldName: 'isinactive', operator: 'is', value1: 'F'}]
    },
    mantainCustomer: function(data,type)
    {
        var customer,
            customerType = type || 'customer',
            isEdit = !!data.internalid,
            customerId;

        if(!isEdit)
        {
            customer = nlapiCreateRecord(customerType);
        } else
        {
            customer = nlapiLoadRecord(customerType,data.internalid);

        }
        _.each(data, function(value,key){
            customer.setFieldValue(key,value);
        });

        var id = nlapiSubmitRecord(customer);
        return id;
    }
});
/* Model that leverages the concept of an item in backend and in frontend
There are a series of processes that an item goes through before being exposed on a website.
Sadly all that transformations, that mean associations between the item properties
and the website properties, are not available in an Schedule Script Context
So we have to recreate all that logic by ourselves.
Meaning chosing the correct price to show (from the webstore pricelevel)
and regenerating the path to the image folder, or the correct item url
 */
Application.defineModel('BackendStoreItem', {
    mapping: {
        'InvtPart': ['inventoryitem'],
        'Kit': ['kititem']
    },
    record: 'item',
    fields: {
        //basic fields exposed. Add your custom fields here!
        internalid: {fieldName: 'internalid'},
        itemid: {fieldName: 'itemid'},
        type: {fieldName: 'type'},
        itemtype: {fieldName: 'itemtype'},
        matrixtype: {fieldName: 'matrixtype'},
        parent: {fieldName: 'parent'},
        urlcomponent: {fieldName: 'urlcomponent'}

    },
    // Returns a collection of items with the items iformation
    // the 'items' parameter is an array of objects {id,type}
    //Almost same code as the reference implementation preloadItems
    preloadItems: function (items, context)
    {
        this.context = this.context || context;

        'use strict';

        var self = this
            ,	items_by_id = {}
            ,	parents_by_id = {};

        items = items || [];

        this.preloadedItems = this.preloadedItems || {};

        items.forEach(function (item)
        {
            if (!item.id || !item.type || item.type === 'Discount')
            {
                return;
            }
            if (!self.preloadedItems[item.id])
            {
                items_by_id[item.id] = {
                    internalid: new String(item.id).toString()
                    ,	itemtype: item.type
                };
            }
        });

        if (!_.size(items_by_id))
        {
            return this.preloadedItems;
        }

        var items_details = this.getItemFieldValues(items_by_id);

        // Generates a map by id for easy access. Notice that for disabled items the array element can be null
        _.each(items_details, function (item)
        {
            if (item && typeof item.itemid !== 'undefined')
            {
                if (item.matrixtype === 'CHILD')
                {
                    parents_by_id[new String(item.parent).toString()] = {
                        internalid: new String(item.parent).toString()
                        ,	itemtype: item.itemtype
                    };
                }

                self.preloadedItems[item.internalid] = item;
            }
        });

        if (_.size(parents_by_id))
        {
            var parents_details = this.getItemFieldValues(parents_by_id);

            _.each(parents_details, function (item)
            {
                if (item && typeof item.itemid !== 'undefined')
                {
                    self.preloadedItems[item.internalid] = item;
                }
            });
        }

        // Adds the parent inforamtion to the child
        _.each(this.preloadedItems, function (item)
        {
            if (item && item.matrixtype === 'CHILD')
            {
                item.matrix_parent = self.preloadedItems[item.parent];
            }
        });

        return this.preloadedItems;
    },

    get: function (id, type, context)
    {
        'use strict';
        this.context = this.context || context;
        this.preloadedItems = this.preloadedItems || {};

        if (!this.preloadedItems[id])
        {
            this.preloadItems([{
                id: id
                ,	type: type
            }], context);
        }
        return this.preloadedItems[id];
    },

    set: function (item)
    {
        'use strict';

        this.preloadedItems = this.preloadedItems || {};

        if (item.internalid)
        {
            this.preloadedItems[item.internalid] = item;
        }
    },

    /* This is where for all items that we grabbed, we post-process information with context and append it to the response */
    getItemFieldValues: function (items_by_id)
    {
        'use strict';

        var self = this;
        var	item_ids = _.values(items_by_id);
        var search = new RecordHelper(this.record, this.fields);
        var results = search.search(_.map(items_by_id, function(item) {
            return {
                id: item.internalid,
                type: self.mapping[item.itemtype]
            };
        })).getResults();

        _.each(results, function(result) {
            _.extend(result,{
                urlcomponent: self._urlcomponent(search.getRecord(result.internalid)),
                price: self._price(search.getRecord(result.internalid)),
                translations: self._texts(search.getRecord(result.internalid)),
                images: self._images(search.getRecord(result.internalid)),
                itemoptions: self._itemOptions(search.getRecord(result.internalid))
            });
        });

        return results;

    },

    //Urlcomponent needs to use the website
    _urlcomponent: function(record)
    {
        var urlcomponent = record.getFieldValue('urlcomponent');
        if(urlcomponent)
        {
            return this.context.domain.fulldomain + urlcomponent
        } else return null;

    },

    /*
    ItemOptions are not easily exposed!
    This is a nasty workaround to get itemoptions and their values, that might be translated!
    We need to load the custitem and custoption, and for that we need field id's. For that we have to use a custom record
    with "getSelectOptions" to cheat to give us scriptid for fields!
     */

    _itemOptions: function(itemRecord)
    {

        var self = this;
        var itemOptions = [];

        if(itemRecord.getFieldValue('matrixtype')==='CHILD')
        {
            var optionsTexts = itemRecord.getFieldTexts('itemoptions'),
                optionsValues = itemRecord.getFieldValues('itemoptions');


            _.each(optionsTexts, function(option, index){

                //BEWARE: Once you do a getSelectOptions, it doesn't seem possible to reuse it, that's why the creation is inside the each.
                var helper = nlapiCreateRecord('customrecord_ef_bs_helper',{recordmode: 'dynamic'}),
                    helperField = helper.getField('custrecord_ef_bs_h_field'),
                    candidates = helperField.getSelectOptions(option, 'is');

                //We're selecting by NAME, so we might have XXX "Name" matches. Now we have to iterate through them, to find the correct one
                _.each(candidates, function(candidate,key){
                    helper.setFieldValue('custrecord_ef_bs_h_field',candidate.id);
                    
                    var candidateScriptId = helper.getFieldValue('custrecord_ef_bs_h_field_scriptid').toLowerCase(),
                        itemOptionScriptId = optionsValues[index].toLowerCase();

                    if( candidateScriptId === itemOptionScriptId)
                    {
                        itemOptions.push({
                            internalid: optionsValues[index].toLowerCase(),
                            label: option,
                            scriptid: candidate.id,
                            index: index
                        });
                    }
                });


            });

            _.each(itemOptions, function(option){
                var itemOptionRecord = nlapiLoadRecord('itemoptioncustomfield',option.scriptid);
                var onlineLanguages = self.context.languages,
                    defaultLanguage = self.context.defaultLanguage,
                    translations = {},
                    languageCount = itemOptionRecord.getLineItemCount('translations'),
                    keysToTranslate = [
                        'label'
                    ],
                    defaultLangKeys = {};

                _.each(keysToTranslate, function (key) {
                    defaultLangKeys[key] = itemOptionRecord.getFieldValue(key)
                });

                translations[defaultLanguage.locale] = defaultLangKeys;

                for (var i = 1; i <= languageCount; i++) {

                    var locale = itemOptionRecord.getLineItemValue('translations', 'locale', i);
                    if (_.findWhere(self.context.languages, {locale: locale})) {
                        var langTranslations = {};
                        _.each(keysToTranslate, function (key) {
                            if (itemOptionRecord.getLineItemValue('translations', key, i) !== null) {
                                langTranslations[key] = itemOptionRecord.getLineItemValue('translations', key, i)
                            }

                        });
                        langTranslations =
                            translations[locale] = _.defaults(langTranslations, defaultLangKeys);
                    }
                }

                var sourceFrom = itemOptionRecord.getFieldValue('sourcefrom').toLowerCase();
                _.extend(option, defaultLanguage,{
                    translations: translations,
                    sourcefrom: sourceFrom,
                    sourcelistid: itemOptionRecord.getFieldValue('sourcefromrecordtype'),
                    value: {
                        internalid:itemRecord.getFieldValue('matrixoption'+sourceFrom),
                        label: itemRecord.getFieldValue('matrixoption'+sourceFrom+'_display')
                    }
                });


                var itemFieldRecord = nlapiLoadRecord('customlist',option.sourcelistid);
                var valueCount = itemFieldRecord.getLineItemCount('customvalue');

                for (var i = 1; i <= valueCount; i++)
                {

                    if(itemFieldRecord.getLineItemValue('customvalue','valueid',i) === option.value.internalid){

                        var extendedValue = {translations:{}};

                        _.extend(extendedValue, {
                            label: itemFieldRecord.getLineItemValue('customvalue','value',i),
                            internalid: itemFieldRecord.getLineItemValue('customvalue','valueid',i),
                            abbr: itemFieldRecord.getLineItemValue('customvalue','abbreviation',i)
                        });
                        _.each(self.context.languages, function(lang){

                            extendedValue.translations[lang.locale] = itemFieldRecord.getLineItemValue('customvalue','value_sname_'+lang.locale,i);
                        });

                        //UGHHHHH!!!!!
                        extendedValue.translations[self.context.defaultLanguage.locale] = itemFieldRecord.getLineItemValue('customvalue','value',i)

                        if(extendedValue.internalid){
                            option.value = extendedValue;
                        }


                    }
                }
                
            });
        }
        return itemOptions;

    },
    //images need their full path
    //TODO: use a resizeid
    _images: function(itemRecord)
    {
        var images = [];
        var imageCount = itemRecord.getLineItemCount('itemimages');


        for( var i=1; i <= imageCount; i++ )
        {
            images.push({
                internalid: itemRecord.getLineItemValue('itemimages', 'nkey', i),
                alt: itemRecord.getLineItemValue('itemimages', 'altTagCaption', i),
                name: itemRecord.getLineItemValue('itemimages', 'name', i),
                url: this.context && this.context.imageurlbase + itemRecord.getLineItemValue('itemimages', 'name', i)
            })
        }
        return images;
    },

    //Texts: we need all translatable fields to become translated in every language that is available on the website
    _texts: function(itemRecord)
    {

        if(this.context && this.context.languages && this.context.defaultLanguage)
        {
            var onlineLanguages = this.context.languages,
                defaultLanguage = this.context.defaultLanguage,
                translations = {},
                languageCount = itemRecord.getLineItemCount('translations'),
                keysToTranslate = [
                    'displayname',
                    'featureddescription',
                    'nopricemessage',
                    'outofstockmessage',
                    'pagetitle',
                    'salesdescription',
                    'storedescription',
                    'storedisplayname',
                    'storedetaileddescription'
                ],
                defaultLangKeys = {};

            _.each(keysToTranslate, function (key) {
                defaultLangKeys[key] = itemRecord.getFieldValue(key)
            });

            translations[defaultLanguage.locale] = defaultLangKeys;

            for (var i = 1; i <= languageCount; i++) {

                var locale = itemRecord.getLineItemValue('translations', 'locale', i);
                if (_.findWhere(this.context.languages, {locale: locale})) {
                    var langTranslations = {};
                    _.each(keysToTranslate, function (key) {
                        if (itemRecord.getLineItemValue('translations', key, i) !== null) {
                            langTranslations[key] = itemRecord.getLineItemValue('translations', key, i)
                        }

                    });
                    langTranslations =
                        translations[locale] = _.defaults(langTranslations, defaultLangKeys);
                }
            }

            return translations;
        }


    },
    /* Price is really tricky to grab, as you can have many scenarios
    The most simple one, is you don't have multicurrency, pricelevels(multiprice) or quantity pricing.
    Then you can have combinations of these features on or off
    In case you have pricelevels, we should grab the one configured as website pricelevel on the website record.
    In case you have quantity pricing, we need to grab the price for the first step (qty 0)
    In case you have multicurrency, we need to grab currencies for all exposed languages

     */
    _price: function(itemRecord){

        var isMultiCurrency = nlapiGetContext().getFeature('MULTICURRENCY'),
            isMultiPrice = nlapiGetContext().getFeature('MULTPRICE'),
            hasQuantityPricing = nlapiGetContext().getFeature('QUANTITYPRICING');


        var prices;
        var pricesByCurrency = {};


        if(!isMultiCurrency && !isMultiPrice && !hasQuantityPricing && this.context && this.context.defaultCurrency)
        {
            //TODO: test this
            prices = {
                price: itemRecord.getFieldValue('rate'),
                price_formatted: formatCurrency(itemRecord.getFieldValue('rate'),this.context.defaultCurrency.symbol,this.context.defaultCurrency.locale_metadata)
            };

        } else {
            if(this.context && this.context.currencies) {

                var context = this.context,
                    currencies = this.context.currencies;

                if (isMultiCurrency) {
                    _.each(currencies, function (currency) {

                        //WE NEED TO SEARCH FOR THE CORRECT LINE OF THE PRICELEVEL, TO PASS IT TO "GETLINEITEMMATRIXVALUE" grrrr
                        var pricelevelCount = itemRecord.getLineItemCount('price' + currency.internalid);
                        var webstorePriceLevelIndex = 1;

                        while (itemRecord.getLineItemValue('price' + currency.internalid, 'pricelevel', webstorePriceLevelIndex) != context.onlinepricelevel) {
                            webstorePriceLevelIndex++;
                        }

                        var tmp = itemRecord.getLineItemMatrixValue('price' + currency.internalid, 'price', webstorePriceLevelIndex, 1); //pricelevel 5, qty 0
                        pricesByCurrency[currency.internalid] = {
                            price: tmp,
                            price_formatted: formatCurrency(tmp, currency.displaysymbol, currency.locale_metadata)
                        };
                    });
                } else {

                    //TODO: test this. Need an acct without multicurrency
                    var pricelevelCount = itemRecord.getLineItemCount('price');
                    var webstorePriceLevelIndex = 1;

                    while (itemRecord.getLineItemValue('price', 'pricelevel', webstorePriceLevelIndex) != context.onlinepricelevel) {
                        webstorePriceLevelIndex++;
                    }

                    var tmp = itemRecord.getLineItemMatrixValue('price', 'price', webstorePriceLevelIndex, 1); //pricelevel 5, qty 0
                    prices = {
                        price: tmp,
                        price_formatted: formatCurrency(tmp, currency.displaysymbol, currency.locale_metadata)
                    };
                }
            }

        }

        if(prices)
        {
            return prices;
        } else
        {
            return pricesByCurrency;
        }


    },

    reset: function()
    {
        delete this.preloadedItems;
    }
});

/* ItemKeyMapping works as a similar concept to the one in frontend
* Given a context (language, currency), returns the correct value.
* It's important that you fix the properties that you changed in frontend
* For example, if you use a custom field for the name, you should change the name key.
* For images, it uses the image 0
* For urlcomponent, it can generate urls with the ?child= for deep linking to the sku.
* For translated fields, it tries to translate the field first
* It also resolves the fact that some attributes are on parents and not on child items (images!)
* You could put custom code to make the image match your SKU image, using your naming convention
* */
var itemKeyMapper = function(context,obj,key)
{
    var value;

    if(key==='name')
    {
        return itemKeyMapper(context,obj,'storedisplayname') || //My store display name
            (obj.matrix_parent && itemKeyMapper(context,obj.matrix_parent,'storedisplayname')) || //My Parent's store display name. Webstore uses this for matrix item name.
            itemKeyMapper(context,obj,'displayname') || //My display name
            (obj.matrix_parent && itemKeyMapper(context,obj.matrix_parent,'displayname')) ||
            itemKeyMapper(context,obj,'itemid')
    }

    if(key==='price' || key==='price_formatted')
    {
        //one price
        if(obj.price[key]){
            value = obj.price[key];
        } else {
            //multicurrency
            value = obj.price[context.currency][key];
        }
    }

    if(key ==='urlcomponent')
    {
        if(obj.matrix_parent){
            value = itemKeyMapper(context,obj.matrix_parent, 'urlcomponent')
        }
        else {
            if (obj.urlcomponent) {
                value = obj.urlcomponent;
            } else {
                value = 'product/' + obj.internalid;
            }
        }

        if(obj.matrix_parent)
        {
            value = value + '?child=' + obj.internalid;
        }
    }

    //Images
    if(key==='imageurl'){
        value = obj.images && obj.images[0] && obj.images[0].url;
    }

    if(key==='imagealt'){
        value = obj.images && obj.images[0] && obj.images[0].alt;
    }

    //Translatable field field
    if(obj.translations && obj.translations[context.language] && obj.translations[context.language][key])
    {
        value = obj.translations[context.language][key];
    }

    if(!value){
        value =  obj[key];
    }

    if(!value && obj.matrix_parent){
        value = itemKeyMapper(context,obj.matrix_parent,key);
    }

    return value

};
Application.defineModel('BackInStockNotification.Location', {
    record: 'location',
    fieldsets: {
        basic: [
            'internalid',
            'name',
            'makeinventoryavailablestore'
        ]
    },
    filters: [
        {fieldName: 'isinactive', operator: 'is', value1: 'F'},
    ],
    columns: {
        internalid: {fieldName: 'internalid'},
        makeinventoryavailablestore: {fieldName: 'makeinventoryavailablestore'},
        name: {fieldName: 'name'}
    },
    getWebstoreAvailableLocations: function()
    {
        //get all the locations that expose stock to the webstore
        var filters = _.clone(this.filters);
        filters.push({fieldName: 'makeinventoryavailablestore', operator: 'is', value1: 'T'});

        var Search = new SearchHelper(
            this.record,
            filters,
            this.columns
        ).search();

        return Search.getResults();
    }
});
/* global session:false, notFoundError:false, SearchHelper:false, Application:false */

Application.defineModel('BackInStockNotification', {
    record: 'customrecord_ef_bs_suscription',
    fieldsets: {
        basic: [
            'internalid',
            'item',
            'itemType',
            'itemName',
            'firstname',
            'lastname',
            'email',
            'created'
        ]
    },
    filters: [
        {fieldName: 'isinactive', operator: 'is', value1: 'F'},
        {fieldName: 'custrecord_ef_bs_s_sent', operator: 'is', value1: 'F'},
        {fieldName: 'isinactive', joinKey:'custrecord_ef_bs_s_item', operator: 'is', value1: 'F'},
        {fieldName: 'isonline', joinKey:'custrecord_ef_bs_s_item', operator: 'is', value1: 'T'}
    ],
    columns: {
        internalid: {fieldName: 'internalid'},
        created: {fieldName: 'created'},
        website: {fieldName: 'custrecord_ef_bs_s_website'},
        customer: {fieldName: 'custrecord_ef_bs_s_customer'},
        item: {fieldName: 'custrecord_ef_bs_s_item'},
        itemName: {fieldName: 'formulatext', join: 'custrecord_ef_bs_s_item', formula: 'case when LENGTH({custrecord_ef_bs_s_item.displayname}) > 0 then {custrecord_ef_bs_s_item.displayname} else {custrecord_ef_bs_s_item.itemid} end' },
        itemType: {fieldName: 'type', joinKey:'custrecord_ef_bs_s_item'},
        firstname: {fieldName: 'custrecord_ef_bs_s_firstname'},
        lastname: {fieldName: 'custrecord_ef_bs_s_lastname'},
        isinactive: {fieldName: 'isinactive'},
        sent: {fieldName: 'custrecord_ef_bs_s_sent'},
        email: {fieldName: 'custrecord_ef_bs_s_email'},
        dateSent: {fieldName: 'custrecord_ef_bs_s_date_sent'},
        subsidiary: {fieldName: 'custrecord_ef_bs_s_subsidiary'},
        currency: {fieldName: 'custrecord_ef_bs_s_currency'} ,
        locale: {fieldName: 'custrecord_ef_bs_s_locale'},
        language: {fieldName: 'custrecord_ef_bs_s_language', type:'getText'},
        processed: {fieldName: 'custrecord_ef_bs_s_processed'}
    },
    list: function (list_header_data)
    {
        //Used from the MyAccount BIS admin panel
        'use strict';
        var filters = _.clone(this.filters);
        filters.push({fieldName: this.columns.customer.fieldName, operator: 'is', value1: nlapiGetUser()+''});
        filters.push({fieldName: this.columns.website.fieldName, operator: 'is', value1:session.getSiteSettings(['siteid']).siteid});

        var Search = new SearchHelper(
            this.record,
            filters,
            this.columns,
            this.fieldsets.basic,
            SC.Configuration.Efficiencies.BackInStockNotification.results_per_page,
            list_header_data.page,
            list_header_data.sort,
            parseInt(list_header_data.order) ===-1? 'desc':'asc'
        ).search();

        var results = Search.getResultsForListHeader();

        //append item results
        var ItemResultHelper = new ItemsResultHelper(this.record,this.columns.item,'item','itemType');
        ItemResultHelper.processResults(results.records);
        return results;

    },

    //Delete BISN from admin panel
    delete: function(id)
    {
        if(this.get(id))
        {
            return nlapiDeleteRecord(this.record, id);
        }
    },
    //Back in stock get one, using searches
    get: function(id,avoidFilteringByUser){
        'use strict';

        var filters = _.clone(this.filters);
        if(!avoidFilteringByUser)
        {
            filters.push({fieldName: this.columns.customer.fieldName, operator: 'is', value1: nlapiGetUser()+''});
        }
        filters.push({fieldName: this.columns.internalid.fieldName, operator: 'is', value1: id});
        filters.push({fieldName: this.columns.website.fieldName, operator: 'is', value1:session.getSiteSettings(['siteid']).siteid});

        var Search = new SearchHelper(this.record, filters, this.columns, this.fieldsets.basic).search();
        var result = Search.getResult();
        if(!result)
        {
            throw notFoundError;
        }
        return result;
    },
    //Create bis
    post: function(data)
    {
        'use strict';
        var record = nlapiCreateRecord(this.record);

        record.setFieldValue(this.columns.website.fieldName, session.getSiteSettings(['siteid']).siteid);
        if(nlapiGetUser())
        {
            record.setFieldValue(this.columns.customer.fieldName, nlapiGetUser()+'');
        }
        record.setFieldValue(this.columns.processed.fieldName, 'F');
        record.setFieldValue(this.columns.firstname.fieldName, data.firstname);
        record.setFieldValue(this.columns.lastname.fieldName, data.lastname);
        record.setFieldValue(this.columns.email.fieldName, data.email);
        record.setFieldValue(this.columns.item.fieldName, data.item);
        record.setFieldValue(this.columns.subsidiary.fieldName, session.getShopperSubsidiary());
        record.setFieldValue(this.columns.currency.fieldName, session.getShopperCurrency().internalid);

        var Environment = Application.getEnvironment(session, request);
        record.setFieldText(this.columns.locale.fieldName, Environment.currentLanguage.locale);
        record.setFieldValue(this.columns.language.fieldName, Environment.currentLanguage.languagename);

        var id = nlapiSubmitRecord(record);
        return id;
    },
    /* Used from UE context to see if this combination of data (email,item,site) already registered to the BIS */
    alreadySubscribed: function(email,item,site)
    {
        var search = new SearchHelper()
                .setRecord(this.record)
                .setColumns({})
                .setFilters([
                    {fieldName: this.columns.isinactive.fieldName, operator: 'is', value1: 'F'},
                    {fieldName: this.columns.sent.fieldName, operator: 'is', value1: 'F'}]
                )
                .addFilter({fieldName: this.columns.email.fieldName, operator: 'is', value1: email})
                .addFilter({fieldName: this.columns.website.fieldName, operator: 'is', value1: site })
                .addFilter({fieldName: this.columns.item.fieldName, operator: 'is',value1: item})
                .search(),
            results = search.getResults();

        return results && results.length > 0;
   },

   //A "page" of back in stock records that their customer is not already "resolved". Meaning that it was not yet
   //analized if they needed a new lead, or they go to a current one, or they were logged
   getNotProcessedLines: function(from,to)
   {
        var search = new SearchHelper()
                        .setRecord(this.record)
                        .setColumns(this.columns)
                        .setSort('created')
                        .setSortOrder('asc')
                        .setFilters([
                            {fieldName: this.columns.isinactive.fieldName, operator: 'is', value1: 'F'},
                            {fieldName: this.columns.processed.fieldName, operator: 'is', value1: 'F'}
                        ]);

       return search.searchRange(from,to).getResults();
   },

   //get a page of BIS notifications, for a website, that are ready to be sent
   getPendingEmails: function(website,from,to){

       //TODO: see what happens without "multiple locations" feature

       //We have to get the list of locations that have stock available for webstore
       //otherwise the item will still be out of stock in the website
       //even if we have stock on backend
       //This cannot be achieved just with a join


       var locations = Application.getModel('BackInStockNotification.Location').getWebstoreAvailableLocations();
       var locationIds = _.map(locations, function(location){
           return location.internalid;
       });

       var filters = [
           {fieldName: 'isinactive', operator: 'is', value1: 'F'},
           {fieldName: 'custrecord_ef_bs_s_sent', operator: 'is', value1: 'F'}, //not sent
           {fieldName: 'custrecord_ef_bs_s_processed', operator: 'is', value1: 'T'}, //but already processed
           {fieldName: 'isinactive', joinKey:'custrecord_ef_bs_s_item', operator: 'is', value1: 'F'}, //item online
           {fieldName: 'isonline', joinKey:'custrecord_ef_bs_s_item', operator: 'is', value1: 'T'}, //item online
           {fieldName: 'inventorylocation', joinKey: 'custrecord_ef_bs_s_item', operator: 'anyof', value1: locationIds}, //and on a web location
           {fieldName: 'locationquantityavailable', joinKey:'custrecord_ef_bs_s_item', operator: 'greaterthan', summary: 'sum', value1:'0'} //with stock more than 0
       ];

       var columns = JSON.parse(JSON.stringify(this.columns)); //Deep clone
       _.each(columns, function(column){
            column.summary = 'group';
       });
       //we're grouping by everything

       _.extend(columns, {
           webstoreQty: {fieldName:'locationquantityavailable', joinKey:'custrecord_ef_bs_s_item', summary: 'sum'}
       });
       //Except for the quantity, that has to be added


       var search = new SearchHelper()
           .setRecord(this.record)
           .setColumns(columns)
           .setFilters(filters)
           .setSort(this.columns.item.fieldName)//sort by item, to use item "cache" as loading an item is expensive
           .setSortOrder('asc');

       return search.searchRange(from,to).getResults();
   },
    markAsSent: function(internalid){
        //Mark sent and mark date sent
        nlapiSubmitField(this.record,internalid,
            [this.columns.sent.fieldName, this.columns.dateSent.fieldName],
            ['T',nlapiDateToString(new Date(), 'datetimetz')]);
    }
});
Application.defineModel('BackInStockNotification.SiteConfiguration',{
    record: 'customrecord_ef_bs_config',
    columns: {
        'internalid': {fieldName: 'internalid'},
        'isinactive': {fieldName: 'isinactive'},
        'website': {fieldName: 'custrecord_ef_bs_c_website'},
        'sender': {fieldName: 'custrecord_ef_bs_c_sender'},
        'template':{fieldName: 'custrecord_ef_bs_c_tpl'},
        'translations':{fieldName: 'custrecord_ef_bs_c_translations'}
    },
    filters: [
        {fieldName: 'isinactive', operator:'is', value1:'F'}
    ],
    getByWebsite: function(internalid) {
        var Search = new SearchHelper(this.record, this.filters, this.columns)
            .addFilter({fieldName: this.columns.website.fieldName, operator: 'is', value1: internalid})
            .addFilter({fieldName: this.columns.isinactive.fieldName, operator: 'is', value1: 'F'})
            .search();

        return Search.getResult();
    },
    list: function() {
        var Search = new SearchHelper(this.record, this.filters, this.columns)
            .addFilter({fieldName: this.columns.isinactive.fieldName, operator: 'is', value1: 'F'})
            .search();

        return Search.getResults();
    },
    getTemplates: function(config)
    {
        var tplFile,
            tplBody,
            tplFunct,
            translationsFile,
            translationsJSON;

        if(config.template)
        {
            tplFile = nlapiLoadFile(config.template);
            if(tplFile)
            {
                tplFunct = _.template(tplFile.getValue());
            }
        }
        if(config.translations)
        {
            translationsFile = nlapiLoadFile(config.translations);
            if(translationsFile)
            {
                try {
                    translationsJSON = JSON.parse(translationsFile.getValue());
                }
                catch(e)
                {
                    nlapiLogExecution('ERROR','Parse Translations JSON Error',e);
                }
            }
        }
        return {
            translations: translationsJSON,
            templateFunction: tplFunct
        }
    }
});
Application.defineModel('BackInStockNotificationWebsite', {
    get: function(websiteId){

        var BackInStockNotificationCurrencyModel = Application.getModel('BackInStockNotificationCurrency');


        var record = nlapiLoadRecord('website', websiteId);
        var website = {
            onlinepricelevel: record.getFieldValue('onlinepricelevel'),
            languages: [],
            currencies: [],
            imagedomain: record.getFieldValue('imagedomain'),
            imageurlbase:'http://' + record.getFieldValue('imagedomain') + this.getFullImagePath(record),
            displayname: record.getFieldValue('displayname'),
            createcustomersascompanies: record.getFieldValue('createcustomersascompanies')
        };

        var languageCount = record.getLineItemCount('sitelanguage');
        var currencyCount = record.getLineItemCount('sitecurrency');

        for(var i = 1; i <= languageCount; i++)
        {
            var line = {
                internalid: record.getLineItemValue('sitelanguage','internalid', i),
                locale: record.getLineItemValue('sitelanguage','locale',i),
                isonline: record.getLineItemValue('sitelanguage', 'isonline',i) == 'T',
                isdefault: record.getLineItemValue('sitelanguage', 'isdefault',i) == 'T'


            };
            if(line.isonline)
            {
                website.languages.push(line);
            }
        }

        for(var j = 1; j <= currencyCount; j++)
        {
            var line = {
                internalid: record.getLineItemValue('sitecurrency','currency',j),
                isdefault: record.getLineItemValue('sitecurrency', 'isdefault',j) == 'T',
                isonline: record.getLineItemValue('sitecurrency', 'isonline',j) == 'T'
            };
            if(line.isonline)
            {
                website.currencies.push(line);
            }
        }

        website.currencies = BackInStockNotificationCurrencyModel.list(_.pluck(website.currencies,'internalid'),true);
        website.defaultLanguage = _.findWhere(website.languages, {isdefault: true});
        website.defaultCurrency = _.findWhere(website.currencies, {isdefault: true});
        website.domain = this.getPrimaryDomain(record);

        return website;
    },
    getPrimaryDomain: function(record){
        //For every link on our emails, we need a DOMAIN.
        //If we have a primary domain, use that. If not, use the first of the website record.
        var countDomains = record.getLineItemCount('shoppingdomain');
        var domain;
        for(var i= 1; i<=countDomains; i++){
            if(record.getLineItemValue('shoppingdomain','isprimary',i)=='T')
            {
                domain = {
                    fulldomain: 'http://'+ record.getLineItemValue('shoppingdomain','domain',i) + '/',
                    domain: record.getLineItemValue('shoppingdomain','domain',i),
                    hostingroot: record.getLineItemValue('shoppingdomain','hostingroot',i),
                    isprimary: record.getLineItemValue('shoppingdomain','isprimary',i)==='T'
                }
            }
        }

        //IF we don't have a primary domain, we should be reading the first one of the domains configured
        if(!domain)
        {
            domain = {
                fulldomain: 'http://'+ record.getLineItemValue('shoppingdomain','domain',1) + '/',
                domain: record.getLineItemValue('shoppingdomain','domain',1),
                hostingroot: record.getLineItemValue('shoppingdomain','hostingroot',1),
                isprimary: record.getLineItemValue('shoppingdomain','isprimary',1)==='T'
            }
        }
        return domain;
    },
    getFullImagePath: function(record){
        //This algorithm that looks for the path to the image folder, will only work if the image folder is under "Web Hosting Files"
        //If not, i'm not sure what would happen
        var imageFolderId = record.getFieldValue('imagefolder');
        var pathToImages = '/';
        while( imageFolderId.indexOf('-')===-1 )
        {
            var j = nlapiLookupField('folder', imageFolderId,['internalid','name','parent','externalid','group','class']);

            imageFolderId = j.parent.toString();
            if(j.parent.indexOf('-')===-1 ) { //grandpa shouldn't be "Web Hosting Files"
                pathToImages = '/' + j.name + pathToImages;
            }
        }
        return pathToImages;
    }
});