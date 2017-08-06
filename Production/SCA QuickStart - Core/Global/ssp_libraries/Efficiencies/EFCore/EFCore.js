/* global Application:true */

/*
 INIT FILE for PS Efficiencies modules. To extend backend configs and pass them to frontend.
 */
Application.getEnvironment = Application.wrapFunctionWithEvents('Application.getEnvironment', Application, Application.getEnvironment);
_.extend(SC.Configuration, {
    Efficiencies: {}
});

//Mount efficiencies config
Application.on('after:Application.getEnvironment', function(obj,result){
    'use strict';
    _.extend(result,{Efficiencies: SC.Configuration.Efficiencies});
});


/* global nlapiCreateSearch:false */
function SearchHelper (record, filters, columns, fieldset, results_per_page,page,sort,sortOrder)
{
    'use strict';
    this.setRecord(record);
    this.setFilters(filters);
    this.setColumns(columns);
    this.setFieldset(fieldset);
    this.setResultsPerPage(results_per_page);
    this.setPage(page);
    this.setSort(sort);
    this.setSortOrder(sortOrder);
}

SearchHelper.prototype.setSort = function (sort)
{
    'use strict';
    this._sortField = sort;
    return this;
};

SearchHelper.prototype.setSortOrder = function (sortOrder)
{
    'use strict';
    this._sortOrder = sortOrder;
    return this;
};

SearchHelper.prototype.setResultsPerPage = function (results_per_page)
{
    'use strict';
    this.results_per_page = results_per_page;
    return this;
};
SearchHelper.prototype.setPage = function (page)
{
    'use strict';
    this.page = page;
    return this;
};

SearchHelper.prototype.setFieldset = function (fieldset)
{
    'use strict';
    this._fieldset = _.clone(fieldset);
    return this;
};

SearchHelper.prototype.setColumns = function (value)
{
    'use strict';
    this._columns = _.clone(value);
    return this;
};

SearchHelper.prototype.setFilters = function (value)
{
    'use strict';
    this._filters = _.clone(value);
    return this;
};

SearchHelper.prototype.addFilter = function (value)
{
    'use strict';
    this._filters = this._filters || [];
    this._filters.push(value);
    return this;
};

SearchHelper.prototype.addColumn = function (value)
{
    'use strict';
    this._columns = this._columns || [];
    this._columns.push(value);
    return this;
};

SearchHelper.prototype.setRecord = function (value)
{
    'use strict';
    this._record = value;
    return this;
};

SearchHelper.prototype.getResult = function ()
{
    'use strict';
    return this._lastResult && this._lastResult.length === 1 && this._lastResult[0];
};

SearchHelper.prototype.getResults = function ()
{
    'use strict';
    return this._lastResult;
};

SearchHelper.prototype.getResultsForListHeader = function ()
{
    'use strict';

    return {
        page: this.page,
        recordsPerPage: this.results_per_page,
        records: this._lastResult,
        totalRecordsFound: this.totalRecordsFound,
        order: this._sortOrder === 'desc'? -1 : 1,
        sort: this._sortField
    };
};

SearchHelper.prototype.getColumns = function ()
{
    'use strict';
    var self = this;
    return _.compact(_.map(this._columns, function (v,k)
    {
        //fieldset column limit
        if(self._fieldset && !_.contains(self._fieldset,k)){
            return null;
        }

        var column = new nlobjSearchColumn(v.fieldName, v.joinKey ? v.joinKey : null, v.summary ? v.summary : null);



        if (v.sort || self._sortField === k)
        {

            if(v.sort)
            {
                column.setSort(v.sort === 'desc');
            }
            else if (self._sortField === k)
            {
                column.setSort(self._sortOrder === 'desc');
            }
        }
        if (v.formula)
        {
            column.setFormula(v.formula);
        }
        return column;
    }));

};

SearchHelper.prototype._mapResult = function (list)
{
    'use strict';

    var self = this,
        props = _.clone(this._columns);

    return (list && list.length && _.map(list, function (line)
    {
        return _.reduce(props, function (o, v, k)
        {

            //Not in fieldset, move along
            if(self._fieldset && !_.contains(self._fieldset,k)){
                return o;
            }

            switch(v.type)
            {
                case 'listrecordToObject':
                case 'file':
                case 'object':
                    o[k] = {
                        internalid: line.getValue(v.fieldName, v.joinKey ? v.joinKey : null, v.summary ? v.summary : null),
                        name: line.getText(v.fieldName, v.joinKey ? v.joinKey : null, v.summary ? v.summary : null)
                    };

                    break;
                case 'getText':
                case 'text':
                    o[k] = line.getText(v.fieldName, v.joinKey ? v.joinKey : null, v.summary ? v.summary : null);
                    break;

                //case 'getValue':
                default:
                    o[k] = line.getValue(v.fieldName, v.joinKey ? v.joinKey : null, v.summary ? v.summary : null);
                    break;
            }

            if (v.applyFunction)
            {
                o[k] = v.applyFunction(line, v, k);
            }

            return o;
        }, {});
    })) || [];
};

SearchHelper.prototype.getFilters = function ()
{
    'use strict';

    return _.map(this._filters || [], function (f)
    {
        var filter = nlobjSearchFilter(f.fieldName, f.joinKey ? f.joinKey : null, f.operator, f.value1 ? f.value1 : null, f.value2 ? f.value2 : null);
        if(f.summary){
            filter.setSummaryType(f.summary);
        };
        return filter;
    }) || [];
};

SearchHelper.prototype.searchRange = function (from, to)
{
    'use strict';
    var search = nlapiCreateSearch(this._record, this.getFilters(), this.getColumns())
    var results = search.runSearch();
    this._lastResult = this._mapResult(results.getResults(from, to));


    return this;
};

SearchHelper.prototype.search = function ()
{
    'use strict';
    var columns = this.getColumns(),
        filters = this.getFilters();

    if(!this.results_per_page)
    {
        this._lastResult = this._mapResult(this._getAllSearchResults(this._record, filters, columns));
    } else
    {
        this.page = this.page || 1;
        var results = this._getPaginatedSearchResults(this._record, filters, columns,this.results_per_page,this.page);
        this._lastResult = this._mapResult(results.records);
        this.totalRecordsFound = results.totalRecordsFound;
    }

    return this;
};

SearchHelper.prototype._searchUnion = function (target, array)
{
    'use strict';
    return target.concat(array);
};

SearchHelper.prototype._getPaginatedSearchResults = function(record_type,filters,columns,results_per_page,page,column_count){

    'use strict';

    var range_start = (page * results_per_page) - results_per_page,
        range_end = page * results_per_page,
        do_real_count = _.any(columns, function (column)
        {
            return column.getSummary();
        }),
        result = {
            page: page,
            recordsPerPage: results_per_page,
            records: []
        };

    if (!do_real_count || column_count)
    {
        var _column_count = column_count || new nlobjSearchColumn('internalid', null, 'count'),
            count_result = nlapiSearchRecord(record_type, null, filters, [_column_count]);

        result.totalRecordsFound = parseInt(count_result[0].getValue(_column_count), 10);
    }

    if (do_real_count || (result.totalRecordsFound > 0 && result.totalRecordsFound > range_start))
    {
        var search = nlapiCreateSearch(record_type, filters, columns).runSearch();
        result.records = search.getResults(range_start, range_end);

        if (do_real_count && !column_count)
        {
            result.totalRecordsFound = search.getResults(0, 1000).length;
        }
    }

    return result;

};
SearchHelper.prototype._getAllSearchResults = function (record_type, filters, columns)
{
    'use strict';
    var search = nlapiCreateSearch(record_type, filters, columns);
    search.setIsPublic(true);

    var searchRan = search.runSearch(),
        bolStop = false,
        intMaxReg = 1000,
        intMinReg = 0,
        result = [];

    while (!bolStop && nlapiGetContext().getRemainingUsage() > 10)
    {
        // First loop get 1000 rows (from 0 to 1000), the second loop starts at 1001 to 2000 gets another 1000 rows and the same for the next loops
        var extras = searchRan.getResults(intMinReg, intMaxReg);

        result = this._searchUnion(result, extras);
        intMinReg = intMaxReg;
        intMaxReg += 1000;
        // If the execution reach the the last result set stop the execution
        if (extras.length < 1000)
        {
            bolStop = true;
        }
    }

    return result;
};

/**
 * Created by pzignani on 21/10/2014.
 * Given a search result from SearchHelper, with an item property, an item column, an item property, and the item type property,
 * grabs the results and appends ITEMS (order-fieldset complete items, in frontend expected format)
 * Record: is the record from where the search comes from
 * RecordItemColumn: the column name where the item is linked
 * ResultItemProperty: on the results, the property id where the itemid resides
 * ResultItemTypeProperty: on the results, the property id where the item type resides
 */
function ItemsResultHelper (record, recordItemColumn,resultItemProperty,resultItemTypeProperty)
{
    'use strict';
    this.record = record;
    this.recordItemColumn = recordItemColumn;
    this.resultItemProperty = resultItemProperty;
    this.resultItemTypeProperty = resultItemTypeProperty;
}

ItemsResultHelper.prototype.processResults = function(results){

    var self = this,
        storeItemModel = Application.getModel('StoreItem'),
        items_to_preload = [];

    _.each(results, function(result){
        items_to_preload.push({
            id: result[self.resultItemProperty],
            type: result[self.resultItemTypeProperty]
        });
    });

    storeItemModel.preloadItems(items_to_preload);

    _.each(results, function(result)
    {
        var itemStored = storeItemModel.get(result[self.resultItemProperty], result[self.resultItemTypeProperty]);
        var itemsToQuery = [];


        if (!itemStored || typeof itemStored.itemid === 'undefined')
        {
            itemsToQuery.push({
                id: result[self.resultItemProperty],
                type: result[self.resultItemTypeProperty]
            });
        }
        else
        {
            _.extend(result, {item: itemStored});
            delete result.itemType;
        }
    });



};
/* Same concept as SearchHelper but for records that sadly have to be loaded whole to get correct info
* Try to avoid it's use
* */

function RecordHelper (record, fields, fieldset) {
    'use strict';
    this.setRecord(record);
    this.setFields(fields);
    this.setFieldset(fieldset);
}


RecordHelper.prototype.setFieldset = function (fieldset)
{
    'use strict';
    this._fieldset = _.clone(fieldset);
    return this;
};

RecordHelper.prototype.setFields = function (value)
{
    'use strict';
    this._fields = _.clone(value);
    return this;
};


RecordHelper.prototype.addField = function (value)
{
    'use strict';
    this._fields = this._fields || [];
    this._fields.push(value);
    return this;
};


RecordHelper.prototype.setRecord = function (value)
{
    'use strict';
    this._record = value;
    return this;
};

RecordHelper.prototype.getResult = function ()
{
    'use strict';
    return this._lastResult && this._lastResult.length === 1 && this._lastResult[0];
};

RecordHelper.prototype.getResults = function ()
{
    'use strict';
    return this._lastResult;
};

RecordHelper.prototype._mapResult = function (list)
{
    'use strict';

    var self = this,
        props = _.clone(this._fields);

    return (list && list.length && _.map(list, function (record)
        {

            var ret = _.reduce(props, function (o, v, k)
            {

                //Not in fieldset, move along
                if(self._fieldset && !_.contains(self._fieldset,k)){
                    return o;
                }

                switch(v.type)
                {
                    case 'listrecordToObject':
                    case 'file':
                    case 'object':
                        o[k] = {
                            internalid: record.getFieldValue(v.fieldName),
                            name: record.getFieldText(v.fieldName)
                        };

                        break;
                    case 'getText':
                    case 'text':
                        o[k] = record.getFieldText(v.fieldName);
                        break;

                    //case 'getValue':
                    default:
                        o[k] = record.getFieldValue(v.fieldName);
                        break;
                }

                if (v.applyFunction)
                {
                    o[k] = v.applyFunction(record, v, k);
                }

                return o;
            }, {});
            ret.internalid = record.getId() + '';
            return ret;
        })) || [];
};


RecordHelper.prototype.get = function(id){
    this.search([id]);
};

RecordHelper.prototype.getRecord = function(id){
    return this._lastResultRecords[id];
}

RecordHelper.prototype.search = function (ids)
{
    'use strict';

    var self = this;
    var results = [];
    this._lastResultRecords = [];


    _.each(ids, function(id){
        if(_.isObject(id)){

            var temp = nlapiLoadRecord(id.type, id.id);
        } else {
            var temp = nlapiLoadRecord(self._record, id); //Cheating for "subclasses" like items heh.
        }
        results.push(temp);
        self._lastResultRecords[temp.getId()] = temp;

    });

    this._lastResult = this._mapResult(results);


    return this;
};