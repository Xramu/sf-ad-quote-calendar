public with sharing class EanScraperService {
    public class ScrapedProductDataDTO {
        @AuraEnabled public String errorMessage;
        @AuraEnabled public String productName;
        @AuraEnabled public String productDescription;
        @AuraEnabled public String productCountryOfOrigin;
    }

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
}