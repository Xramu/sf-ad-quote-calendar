import fetchProductDetailsJsonFromEanCode from '@salesforce/apex/EanScraperService.fetchProductDetailsJsonFromEanCode';

export class ProductDataHandler {
  data = {};

  isLoadingData = false;
  hasError = false;
  errorMessage = '';

  #errorPrefix = 'Tuotteen tietoja ei voitu hakea: ';
  #flagError = (errorMessage) => {
    this.hasError = true;
    this.errorMessage = errorMessage;
  };

  #clearError = () => {
    this.hasError = false;
    this.errorMessage = '';
  };

  #comparisonUnitTable = {
    'KGM': 'kg'
  }

  async fetchProductData(eanCode) {
    // Reset data and
    this.data = {};
    this.#clearError();

    // Validate EAN
    if (!eanCode) {
      this.#flagError(this.#errorPrefix + 'EAN code was null');
      return false;
    }

    // Good to go for fetch, indicate loading
    this.isLoadingData = true;

    try {
      // Fetch and try to parse the received json
      const rawJson = await fetchProductDetailsJsonFromEanCode({ eanCode: (eanCode)});
      const parsedData = JSON.parse(rawJson);

      if (parsedData.error) {
        // parsing resulted in an error
        this.#flagError(this.#errorPrefix + parsedData.error);
      } else {
        // Pass the data and hope S-Kaupat has not changed the format
        this.data = parsedData;
      }
    } catch(e) {
      console.log(e);
      this.#flagError(this.#errorPrefix + e);
    }

    // Always stop loading even of errors
    this.isLoadingData = false;

    // Return true if fetch was success
    return !this.hasError;
  }

  hasData() {
    return !!this.data && Object.keys(this.data).length > 0;
  }

  // Data Reading Methods
  getName() {
    return this.data?.name;
  }

  getDescription() {
    return this.data?.description;
  }

  getPrice() {
    return this.data?.price;
  }

  getPriceUnit() {
    return this.data?.priceUnit;
  }

  getPriceWithUnit() {
    return (this.getPrice() && this.getPriceUnit()) ? `${this.getPrice()}€ ${this.getPriceUnit()}` : null;
  }

  getComparisonUnit() {
    return this.data?.comparisonUnit ? this.#comparisonUnitTable[this.data.comparisonUnit] : null;
  }

  getComparisonPrice() {
    return this.data?.comparisonPrice;
  }

  getComparisonPriceWithUnit() {
    return (this.getComparisonPrice() && this.getComparisonUnit()) ? `${this.getComparisonPrice()}€/${this.getComparisonUnit()}` : null;
  }

  getIngredients() {
    return this.data?.ingredientStatement;
  }

  getStorageGuideForConsumer() {
    return this.data?.productDetails?.storageGuideForConsumer;
  }

  getCountryOfOrigin() {
    return this.data?.countryName?.fi;
  }

  getBrandName() {
    return this.data?.brandName;
  }

  getContactInformation() {
    return this.data?.productDetails?.contactInformation?.replaceAll('###', '').replace('Yhteystiedot', '');
  }

  getEanCode() {
    return this.data?.ean;
  }

  getImageUrl(width = 360, height = 360) {
    return this.data?.productDetails?.productImages?.mainImage?.urlTemplate?.replace('{MODIFIERS}', `w${width}h${height}@_q75`).replace('{EXTENSION}', 'webp');
  }

  getNutrientsEntry(entryIndex) {
    return this.data?.productDetails?.nutrients?.[entryIndex]?.nutrients;
  }

  getNutrientsReferenceQuantity(entryIndex) {
    return this.data?.productDetails?.nutrients?.[entryIndex]?.referenceQuantity;
  }
}

// Helper method to create title value pairs
const createDataEntry = (title, value) => (value && title) ? ({title: title, value: value}) : null;

/**
 * Formatter class handling the title : value pair formatting in Finnish for a product data handler
 */
export class ProductDataFormatter {
  dataHandler;

  // Comparison price titles in finnish based on the unit
  #comparisonUnitTitleTable = {
    'kg': 'Kilohinta'
  }

  constructor(productDataHandler) {
    this.dataHandler = productDataHandler;
  }

  // Creating title : value pairs with finnish titles
  createNameEntry() {
    return createDataEntry('Nimi', this.dataHandler.getName());
  }

  createDescriptionEntry() {
    return createDataEntry('Kuvaus', this.dataHandler.getDescription());
  }

  createPriceEntry() {
    return createDataEntry('Hinta', this.dataHandler.getPriceWithUnit());
  }

  createComparisonPriceEntry() {
    return createDataEntry(this.#comparisonUnitTitleTable[this.dataHandler.getComparisonUnit()], this.dataHandler.getComparisonPriceWithUnit());
  }

  createIngredientsEntry() {
    return createDataEntry('Ainesosat', this.dataHandler.getIngredients());
  }

  createStorageGuideForConsumerEntry() {
    return createDataEntry('Säilytysohje', this.dataHandler.getStorageGuideForConsumer());
  }

  createCountryOfOriginEntry() {
    return createDataEntry('Valmistusmaa', this.dataHandler.getCountryOfOrigin());
  }

  createBrandNameEntry() {
    return createDataEntry('Valmistaja', this.dataHandler.getBrandName());
  }

  createContactInformationEntry() {
    return createDataEntry('Yhteystiedot', this.dataHandler.getContactInformation());
  }

  createEanCodeEntry() {
    return createDataEntry('EAN Koodi', this.dataHandler.getEanCode());
  }

  createNutrientEntries(entryIndex) {
    const nutrients = this.dataHandler.getNutrientsEntry(entryIndex);

    if (!nutrients) {
      return null;
    }

    // Create entries of each nutrient entry. Filter out any possible empty entries
    return nutrients.map((entry) => createDataEntry(entry.name, entry.value)).filter((entry) => !!entry);
  }
}

/**
 * Extended from data handler, has its own formatter
 */
export class ProductDataManager extends ProductDataHandler{
  formatter;
  
  constructor() {
    super();
    
    this.formatter = new ProductDataFormatter(this);
  }
}