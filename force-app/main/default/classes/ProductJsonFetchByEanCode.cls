public with sharing class ProductJsonFetchByEanCode {
    @InvocableMethod(label='Fetch SOK Product JSON By EAN' description='Scrapes the whole product data JSON from s-kaupat.fi with the given EAN code.')
    public static List<String> fetchProductJsonByEanCode(List<String> eanCode) {
        List<String> results = new List<String>();

        for (String ean : eanCode) {
            results.add(EanScraperService.fetchProductDetailsJsonFromEanCode(ean));
        }

        return results;
    }
}