define('FacetTranslatorFix',['Facets.Translator'],function(Translator){
    _.extend(Translator.prototype,{
        getUrl: function ()
		{
			var url = ''
			,	self = this;

			// Prepears the seo limits
			var facets_seo_limits = {};
			if (SC.ENVIRONMENT.jsEnvironment === 'server')
			{
				facets_seo_limits = {
					numberOfFacetsGroups: this.configuration.facetsSeoLimits && this.configuration.facetsSeoLimits.numberOfFacetsGroups || false
				,	numberOfFacetsValues: this.configuration.facetsSeoLimits && this.configuration.facetsSeoLimits.numberOfFacetsValues || false
				,	options: this.configuration.facetsSeoLimits && this.configuration.facetsSeoLimits.options || false
				};
			}

			// If there are too many facets selected
			if (facets_seo_limits.numberOfFacetsGroups && this.facets.length > facets_seo_limits.numberOfFacetsGroups)
			{
				return '#';
			}

			// Adds the category if it's prsent
			var category_string = this.getFacetValue('category');
			if (category_string)
			{
				url = self.configuration.facetDelimiters.betweenDifferentFacets + category_string;
			}

			// Encodes the other Facets
			var sorted_facets = _.sortBy(this.facets, 'url');
			for (var i = 0; i < sorted_facets.length; i++)
			{
				var facet = sorted_facets[i];
				// Category should be already added
				if (facet.id === 'category')
				{
					continue;
				}
				var name = facet.url || facet.id,
					value = '';
				switch (facet.config.behavior)
				{
				case 'range':
					facet.value = (typeof facet.value === 'object') ? facet.value : {from: 0, to: facet.value};
					value = facet.value.from + self.configuration.facetDelimiters.betweenRangeFacetsValues + facet.value.to;
					break;
				case 'multi':
					value = facet.value.sort().join(self.configuration.facetDelimiters.betweenDifferentFacetsValues);

					if (facets_seo_limits.numberOfFacetsValues && facet.value.length > facets_seo_limits.numberOfFacetsValues)
					{
						return '#';
					}

					break;
				default:
					value = facet.value;
				}

				url += self.configuration.facetDelimiters.betweenDifferentFacets + name + self.configuration.facetDelimiters.betweenFacetNameAndValue + value;
			}

			url = (url !== '') ? url : '/'+this.configuration.fallbackUrl;

			// Encodes the Options
			var tmp_options = {}
			,	separator = this.configuration.facetDelimiters.betweenOptionNameAndValue;
			if (this.options.order && this.options.order !== this.configuration.defaultOrder)
			{
				tmp_options.order = 'order' + separator + this.options.order;
			}

			if (this.options.page && parseInt(this.options.page, 10) !== 1)
			{
				tmp_options.page = 'page' + separator + encodeURIComponent(this.options.page);
			}

			if (this.options.show && parseInt(this.options.show, 10) !== this.configuration.defaultShow)
			{
				tmp_options.show = 'show' + separator + encodeURIComponent(this.options.show);
			}

			if (this.options.display && this.options.display !== this.configuration.defaultDisplay)
			{
				tmp_options.display = 'display' + separator + encodeURIComponent(this.options.display);
			}

			if (this.options.keywords && this.options.keywords !== this.configuration.defaultKeywords)
			{
				tmp_options.keywords = 'keywords' + separator + encodeURIComponent(this.options.keywords);
			}

			var tmp_options_keys = _.keys(tmp_options)
			,	tmp_options_vals = _.values(tmp_options);


			// If there are options that should not be indexed also return #
			if (facets_seo_limits.options && _.difference(tmp_options_keys, facets_seo_limits.options).length)
			{
				return '#';
			}

			url += (tmp_options_vals.length) ? this.configuration.facetDelimiters.betweenFacetsAndOptions + tmp_options_vals.join(this.configuration.facetDelimiters.betweenDifferentOptions) : '';

			return _(url).fixUrl();
		}
    })
});