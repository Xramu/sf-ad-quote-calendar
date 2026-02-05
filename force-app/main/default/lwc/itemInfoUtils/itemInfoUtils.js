import fetchProductDetailsJsonFromEanCode from '@salesforce/apex/EanScraperService.fetchProductDetailsJsonFromEanCode';

const errorPrefix = 'Tuotteen tietoja ei voitu hakea: ';

const createError = (errorMessage) => ({ error: errorMessage });

export const fetchProductData = async (eanCode) => {
  // Validate EAN
  if (!eanCode) {
    return createError(errorPrefix + 'EAN code was null');
  }

  try {
    // Fetch and try to parse the received json
    const rawJson = await fetchProductDetailsJsonFromEanCode({ eanCode: (eanCode)});
    const parsedData = JSON.parse(rawJson);

    if (parsedData.error) {
      // parsing resulted in an error
      return createError(errorPrefix + parsedData.error);
    } else {
      // Pass the data and hope S-Kaupat has not changed the format
      return parsedData;
    }
  } catch(e) {
    console.log(e);
    return createError(errorPrefix + e);
  }
}

export class ProductDataReader {
  getName = (data) => data?.name;

  getDescription = (data) => data?.description;

  getPrice = (data) => data?.price;
  
  getComparisonPrice = (data) => data?.comparisonPrice ? `${data.comparisonPrice}€/kg` : null;
  
  getIngredients = (data) => data?.ingredientStatement;
  
  getStorageGuideForConsumer = (data) => data?.productDetails?.storageGuideForConsumer;
  
  getCountryOfOrigin = (data) => data?.countryName?.fi;

  getBrandName = (data) => data?.brandName;

  getContactInformation = (data) => data?.productDetails?.contactInformation ? data?.productDetails?.contactInformation.replaceAll('###', '').replace('Yhteystiedot', '') : null;

  getEanCode = (data) => data?.ean;

  getImageUrl360 = (data) => {
    const template = data?.productDetails.productImages?.mainImage?.urlTemplate;
    return template ? template.replace('{MODIFIERS}', 'w360h360@_q75').replace('{EXTENSION}', 'webp') : null;
  }

  getNutrientsEntry = (data, entryIndex) => data?.productDetails?.nutrients?.[entryIndex]?.nutrients;

  getNutrientsReferenceQuantity = (data, entryIndex) => data?.productDetails?.nutrients?.[entryIndex]?.referenceQuantity;
}