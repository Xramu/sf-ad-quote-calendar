public with sharing class EanScraperService {
    // Beginning of the url before the EAN code
    public static final String S_KAUPAT_PRODUCT_URL_PREFIX = 'https://www.s-kaupat.fi/tuote/';

    //#region Helper methods

    private static Boolean htmlResultedInError(string htmlResult) {
        return htmlResult.startsWith('Error');
    }

    private static String createJsonErrorMessage(String errorMessage) {
        return '{ "error": "' + errorMessage + '" }';
    }

    private static Map<String, Object> createMapErrorMessage(String errorMessage) {
        Map<String, Object> errorMap = new Map<String, Object>();
        errorMap.put('error', errorMessage);

        return errorMap;
    }

    //#endregion

    /**
     * Tries to get the html body of the given url.
     * Follows permanent redirect 308 with a relative path.
     */
    @AuraEnabled
    public static String fetchHtmlBodyFromUrl(String url) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();

        request.setEndpoint(url);
        request.setMethod('GET');

        try {
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() == 200) {
                // Success, return html body
                return response.getBody();
            } else if (response.getStatusCode() == 308) {
                // Redirect given as a relative path
                System.URL originalUrl = new System.URL(url);
                String base = originalUrl.getProtocol() + '://' + originalUrl.getHost();

                return fetchHtmlBodyFromUrl(base + response.getHeader('Location'));
            } else {
                // Request did not succeed
                return 'Error: ' + response.getStatusCode() + ' ' + response.getStatus();
            }
        } catch (Exception e) {
            // Something went wrong with the request sending
            return 'Error: ' + e.getMessage();
        }
    }

    /**
     * Uses the predefined prefix for the product search url, adds the given EAN on it and calls the html body fetch function.
     */
    private static String fetchHtmlBodyFromEanCode(String eanCode) {
        return fetchHtmlBodyFromUrl(S_KAUPAT_PRODUCT_URL_PREFIX + eanCode);
    }

    private static Map<String, Object> fetchProductDetailsMapFromEanCode(String eanCode) {
        String htmlResult = fetchHtmlBodyFromEanCode(eanCode);

        // Check for error
        if (htmlResultedInError(htmlResult)) {
            return createMapErrorMessage(htmlResult);
        }

        // Start of the script element that has the data json of the site inside it.
        String startMarker = '<script id="__NEXT_DATA__" type="application/json">';

        // Index of the position inside the html string where the start marker starts.
        Integer startIndex = htmlResult.indexOf(startMarker);

        // Checking if index was not found
        if (startIndex <= -1) {
            return createMapErrorMessage('Could not find the start of the data script element from requested html!');
        }

        // Start and end of the actual JSON data section of the html string
        Integer jsonStartIndex = startIndex + startMarker.length();
        Integer jsonEndIndex = htmlResult.indexOf('</script>', jsonStartIndex);

        // Validate end
        if (jsonEndIndex <= -1) {
            return createMapErrorMessage('Could not find the end of the data script element from requested html.');
        }

        // Try parsing the found JSON
        try {
            Map<String, Object> fullMap = (Map<String, Object>) JSON.deserializeUntyped(htmlResult.substring(jsonStartIndex, jsonEndIndex));
            Map<String, Object> props = (Map<String, Object>) fullMap.get('props');
            Map<String, Object> pageProps = (Map<String, Object>) props.get('pageProps');
            Map<String, Object> apolloState = (Map<String, Object>) pageProps.get('apolloState');

            // Loop apolloState keys to find and serialize the product one to return it.
            for (String key : apolloState.keySet()) {
                if (key.startsWith('Product:')) {
                    return (Map<String, Object>) apolloState.get(key);
                }
            }
        } catch (Exception e) {
            // Error parsing
            return createMapErrorMessage('Failed to parse the html result\'s JSON data.' + e.getMessage());
        }

        return createMapErrorMessage('Failed to find Product data section from the received JSON data.');
    }

    @AuraEnabled
    public static String fetchProductDetailsJsonFromEanCode(String eanCode) {
        if (eanCode == null) {
            return createJsonErrorMessage('Given EAN code was invalid or null.');
        }

        // Get map
        Map<String, Object> productDetailsMap = fetchProductDetailsMapFromEanCode(eanCode);
        String serializedJson;

        // Safely try to serialize
        try {
            serializedJson = JSON.serialize(productDetailsMap);
        } catch (Exception e) {
            return createJsonErrorMessage('Failed to serialize the mapped product data to JSON: ' + e.getMessage());
        }

        // Parse success
        return serializedJson;
    }

    @InvocableMethod(label='Fetch Product Name With EAN Code' description='Searches for a product name from s-kaupat.fi using the given EAN code.')
    public static List<String> fetchProductNameFromEanCodeFlow(List<String> eanCode) {
        List<String> results = new List<String>();

        // Fetch name for each input
        for (String input : eanCode) {
            results.add(fetchProductNameFromEanCode(input));
        }

        return results;
    }

    @AuraEnabled
    public static String fetchProductNameFromEanCodeAura(String eanCode){
        return fetchProductNameFromEanCode(eanCode);
    }

    /**
     * Fetches all the product data of the product and returns its name.
     */
    private static String fetchProductNameFromEanCode(String eanCode) {
        if (eanCode == null) {
            return 'Invalid EAN code given.';
        }

        String name = (String) fetchProductDetailsMapFromEanCode(eanCode).get('name');

        if (name != null) {
            return name;
        }

        return 'Could not find name for EAN: ' + eanCode;
    }

    private static String getValueFromProductDetails(Map<String, Object> details, Object key) {
        if (details == null || key == null || !(key instanceof String)) {
            return null;
        }

        return String.valueOf(details.get((String) key));
    }
    
    private static String getValueFromProductDetails(Map<String, Object> details, List<String> location) {
        if (details == null) {
            return null;
        }
        
        Map<String, Object> loopMap = details;
        
        // Loop until the last location is last
        for (Integer i = 0; i < location.size() - 1; i++) {
            Object nextElement = loopMap.get(location[i]);
            
            if (nextElement instanceof Map<String, Object>) {
                loopMap = (Map<String, Object>) loopMap.get(location[i]);
            } else {
                return null;
            }
            
            // Get was faulty
            if (loopMap == null) {
                return null;
            }
        }
        
        // Return the value of the last location
        return getValueFromProductDetails(loopMap, location[location.size() - 1]);
    }

    //#region Product Details Reading Helpers
    
    /**
     * Returns the found string in the details map with the given key OR the fallback string if value from map was not found.
     */
    private static String getDetailWithFallback(Map<String, Object> details, String key, String fallback) {
        return getValueFromProductDetails(details, key) ?? fallback;
    }

    /**
     * Returns the found string in the details map with the location as a list of keys OR the fallback string if value from map was not found.
     */
    private static String getDetailWithFallback(Map<String, Object> details, List<String> location, String fallback) {
        return getValueFromProductDetails(details, location) ?? fallback;
    }

    public static String getProductNameFromDetailsMap(Map<String, Object> details) {
        return getDetailWithFallback(details, 'name', 'Name Not Found');
    }

    public static String getProductDescriptionFromDetailsMap(Map<String, Object> details) {
        return getDetailWithFallback(details, 'description', 'Description Not Found');
    }

    public static String getProductPriceFromDetailsMap(Map<String, Object> details) {
        return getDetailWithFallback(details, 'price', 'Price Not Found');
    }

    public static String getProductBrandNameFromDetailsMap(Map<String, Object> details) {
        return getDetailWithFallback(details, 'brandName', 'Brand Name Not Found');
    }

    public static String getProductCountryOfOriginFromDetailsMap(Map<String, Object> details) {
        return getDetailWithFallback(details, new List<String>{'countryName', 'fi'}, 'Country of Origin Not Found');
    }

    //#endregion
}