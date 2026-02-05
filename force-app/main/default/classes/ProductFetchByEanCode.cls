public with sharing class ProductFetchByEanCode {
    // Result DTO
    public class ProductFetchedData {
        @InvocableVariable(label='Product Name' description='Name of the product.')
        public String name;

        @InvocableVariable(label='Product Description' description='Detailed description of the product.')
        public String description;
        
        @InvocableVariable(label='Product Price' description='Price of the product in Euros.')
        public String price;
        
        @InvocableVariable(label='Product Brand Name' description='Brand of the product.')
        public String brandName;
        
        @InvocableVariable(label='Product Country Of Origin' description='Country that the product originates from.')
        public String countryOfOrigin;
    }

    @InvocableMethod(label='Fetch SOK Product Details By EAN' description='Scrapes the s-kaupat.fi website for the data of the given product with a matching EAN code.')
    public static List<ProductFetchedData> fetchProductDetailsByEanCode(List<String> eanCode) {
        List<ProductFetchedData> results = new List<ProductFetchedData>();

        for (String ean : eanCode) {
            results.add(fetchProductDetailsByEanCode(ean));
        }

        return results;
    }

    private static ProductFetchedData fetchProductDetailsByEanCode(String eanCode) {
        // Tell scraper to fetch and parse data into a map
        Map<String, Object> details = EanScraperService.fetchProductDetailsMapFromEanCode(eanCode);

        // Create new DTO and populate the data with helper methods
        ProductFetchedData dto = new ProductFetchedData();
        dto.name = EanScraperService.getProductNameFromDetailsMap(details);
        dto.description = EanScraperService.getProductDescriptionFromDetailsMap(details);
        dto.price = EanScraperService.getProductPriceFromDetailsMap(details);
        dto.brandName = EanScraperService.getProductBrandNameFromDetailsMap(details);
        dto.countryOfOrigin = EanScraperService.getProductCountryOfOriginFromDetailsMap(details);

        return dto;
    }
}