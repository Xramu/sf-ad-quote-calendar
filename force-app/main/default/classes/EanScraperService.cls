public with sharing class EanScraperService {
    /**
     * Tries to get the html body of the given url.
     * Follows permanent redirect 308 with a relative path.
     */
    @AuraEnabled
    public static String getHtmlBodyFromUrl(String url) {
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

                return getHtmlBodyFromUrl(base + response.getHeader('Location'));
            } else {
                // Request did not succeed
                return 'Error: ' + response.getStatusCode() + ' ' + response.getStatus();
            }
        } catch (Exception e) {
            // Something went wrong with the request sending
            return 'Error: ' + e.getMessage();
        }
    }

    private static Boolean htmlResultedInError(string htmlResult) {
        return htmlResult.startsWith('Error');
    }

    private static String createJsonErrorMessage(String errorMessage) {
        return String.format('{ "error": "{0}" }', errorMessage);
    }

    public static String getProductDetailsJsonFromUrl(String url){
        String htmlResult = getHtmlBodyFromUrl(url);

        // Check for error
        if (htmlResultedInError(htmlResult)) {
            return createJsonErrorMessage(htmlResult);
        }

        // Start of the script element that has the data json of the site inside it.
        String startMarker = '<script id="__NEXT_DATA__" type="application/json">';

        // Index of the position inside the html string where the start marker starts.
        Integer startIndex = htmlResult.indexOf(startMarker);

        // Checking if index was not found
        if (startIndex <= -1) {
            return createJsonErrorMessage('Could not find the start of the data script element from requested html!');
        }

        // Start and end of the actual JSON data section of the html string
        Integer jsonStartIndex = startIndex + startMarker.length();
        Integer jsonEndIndex = htmlResult.indexOf('</script>', jsonStartIndex);

        // Try parsing the found JSON
        try {
            
        } catch (Exception e) {

        }
    }
}