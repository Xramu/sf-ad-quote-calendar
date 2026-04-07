public class AdWebCartItemProcessor {

    public class ProcessingRequest {
        @InvocableVariable(label='Cart ID' required=true)
        public Id cartId;
        
        @InvocableVariable(label='CSV Content' required=true)
        public String csvContent;
    }

    @InvocableMethod(label='Create AdWebCartItems from CSV' category='Commerce')
    public static List<List<AdWebCartItem__c>> processCsvLines(List<ProcessingRequest> requests) {
        List<List<AdWebCartItem__c>> results = new List<List<AdWebCartItem__c>>();

        for (ProcessingRequest req : requests) {
            if (String.isBlank(req.csvContent)) continue;

            List<AdWebCartItem__c> itemsToCreate = new List<AdWebCartItem__c>();
            List<String> lines = req.csvContent.split('\n');
            Set<String> skus = new Set<String>();

            // Step 1: Collect SKUs for bulk query
            for (String line : lines) {
                List<String> columns = line.split(';');
                if (columns.size() >= 2) skus.add(columns[1].trim());
            }

            // Step 2: Map AdSpaceSpecifications by SKU
            Map<String, Id> skuToSpecIdMap = new Map<String, Id>();
            for (AdSpaceSpecification__c spec : [SELECT Id, SKU_Identifier__c FROM AdSpaceSpecification__c WHERE SKU_Identifier__c IN :skus]) {
                skuToSpecIdMap.put(spec.SKU_Identifier__c, spec.Id);
            }

            // Step 3: Process lines and build records
            for (String line : lines) {
                if (String.isBlank(line)) continue;
                List<String> col = line.split(';');
                if (col.size() < 5) continue;

                String offerOrInspiration = col[2].trim();
                String sku = col[1].trim();
                String jsonData = col[4].trim();

                AdWebCartItem__c newItem = new AdWebCartItem__c(
                    Cart__c = req.cartId,
                    AdSpaceSpecification__c = skuToSpecIdMap.get(sku),
                    ExtraJsonData__c = jsonData
                );

                // Parse JSON for specific mappings
                try {
                    Map<String, Object> meta = (Map<String, Object>) JSON.deserializeUntyped(jsonData);
                    
                    if (meta.containsKey('product_ean')) {
                        newItem.EAN__c = String.valueOf(meta.get('product_ean'));
                        // If it's a product/EAN row, it's usually an Offer
                        newItem.OfferName__c = offerOrInspiration;
                    } 
                    
                    if (meta.containsKey('brand_name')) {
                        newItem.Brand__c = String.valueOf(meta.get('brand_name'));
                    }

                    // Logic for Inspiration vs Offer (Example: if no EAN, treat as Inspiration)
                    if (!meta.containsKey('product_ean') && !meta.containsKey('brand_name')) {
                        newItem.InspirationName__c = offerOrInspiration;
                    }

                } catch (Exception e) {
                    System.debug('Error parsing JSON for line: ' + line);
                }

                itemsToCreate.add(newItem);
            }
            results.add(itemsToCreate);
        }

        return results;
    }
}