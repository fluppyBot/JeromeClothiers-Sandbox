/**
 * Created by pzignani on 01/10/2014.
 */
_.extend(SC.Configuration.Efficiencies, {
    BackInStockNotification: {
        leadsourceId: 2, //LeadSource of automatically registered leads
        results_per_page: 10, //Results per page on the MyAccount admin interface
        stockeable_item_types: ['InvtPart'], //Item types that you can subscribe to

        //Localecurrency_metadata is tricky. For each currency there is a default locale asociated
        //This is the locale that the frontend uses for showing correct format.
        //It does NOT use the locale passed for currencies.
        //We are commiting the same mistake to be consistent
        //So for each currency, you need to think the locale of the country it comes from, and how they set up pricing formats
        //diferent examples: -$10.000,00 and ($10,000.00)
        localecurrency_metadata: [
            {
                currency: '1',
                //name: 'Dollars',
                locale_metadata: {
                    groupseparator : ',',
                    decimalseparator : '.',
                    negativeprefix : '(',
                    negativesuffix : ')'
                }
            },
            {
                currency: '5',
                //name: 'UYP',
                locale_metadata: {
                    groupseparator : '.',
                    decimalseparator : ',',
                    negativeprefix : '-',
                    negativesuffix : ''
                }
            }
        ],
        //TODO: review if this is taken from here
        duplicate_criteria: {
            email: true,
            subsidiary: true, //Check only on same subsidiary
            giveaccess: true, //Check only between users with access
            isinactive: true
        }
    }
});
