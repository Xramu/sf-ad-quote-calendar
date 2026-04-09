import fetchProductDetailsJsonFromEanCode from '@salesforce/apex/EanScraperService.fetchProductDetailsJsonFromEanCode';

export class ProductDataHandler {
  data = {};

  isLoadingData = false;
  hasError = false;
  errorMessage = '';

  #errorPrefix = 'Could not fetch product data: ';
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
  #comparisonUnitTitleTableFi = {
    'kg': 'Kilohinta'
  }

  #comparisonUnitTitleTableEn = {
    'kg': 'Price per Kilogram'
  }

  constructor(productDataHandler) {
    this.dataHandler = productDataHandler;
  }

  // Creating title : value pairs with finnish titles
  createNameEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Name' : 'Nimi', this.dataHandler.getName());
  }

  createDescriptionEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Description' : 'Kuvaus', this.dataHandler.getDescription());
  }

  createPriceEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Price' : 'Hinta', this.dataHandler.getPriceWithUnit());
  }

  createComparisonPriceEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? this.#comparisonUnitTitleTableEn[this.dataHandler.getComparisonUnit()] : this.#comparisonUnitTitleTableFi[this.dataHandler.getComparisonUnit()], this.dataHandler.getComparisonPriceWithUnit());
  }

  createIngredientsEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Ingredients' : 'Ainesosat', this.dataHandler.getIngredients());
  }

  createStorageGuideForConsumerEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Storage Instructions' : 'Säilytysohje', this.dataHandler.getStorageGuideForConsumer());
  }

  createCountryOfOriginEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Country of Origin' : 'Valmistusmaa', this.dataHandler.getCountryOfOrigin());
  }

  createBrandNameEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Manufacturer' : 'Valmistaja', this.dataHandler.getBrandName());
  }

  createContactInformationEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'Contact Information' : 'Yhteystiedot', this.dataHandler.getContactInformation());
  }

  createEanCodeEntry(inEnglish = false) {
    return createDataEntry(inEnglish ? 'EAN Code' : 'EAN Koodi', this.dataHandler.getEanCode());
  }

  createNutrientEntries(entryIndex = false) {
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