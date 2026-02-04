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

    /**
     * Fetches the whole html of the product with the EAN code, tries to parse the data section at the end of it and return the product's data.
     */
    @AuraEnabled
    public static String fetchProductDetailsJsonFromEanCode(String eanCode){
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

    private static String fetchProductNameFromEanCode(String eanCode) {
        String name = (String) fetchProductDetailsMapFromEanCode(eanCode).get('name');

        if (name != null) {
            return name;
        }

        return 'Could not find name for EAN: ' + eanCode;
    }
}