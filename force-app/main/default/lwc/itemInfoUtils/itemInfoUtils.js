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

  fetchProductData = async (eanCode) => {
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

  hasData = () => (!!this.data && Object.keys(this.data).length > 0);

  // Data Reading Methods
  getName = () => this.data?.name;

  getDescription = () => this.data?.description;

  getPrice = () => this.data?.price;

  getPriceUnit = () => this.data?.priceUnit;

  getPriceWithUnit = () => (this.getPrice() && this.getPriceUnit()) ? `${this.getPrice()}€ ${this.getPriceUnit()}` : null;
  
  getComparisonUnit = () => this.data?.comparisonUnit ? this.#comparisonUnitTable[this.data.comparisonUnit] : null;

  getComparisonPrice = () => this.data?.comparisonPrice;
  
  getComparisonPriceWithUnit = () => (this.getComparisonPrice() && this.getComparisonUnit()) ? `${this.getComparisonPrice()}€/${this.getComparisonUnit()}` : null;

  getIngredients = () => this.data?.ingredientStatement;
  
  getStorageGuideForConsumer = () => this.data?.productDetails?.storageGuideForConsumer;
  
  getCountryOfOrigin = () => this.data?.countryName?.fi;

  getBrandName = () => this.data?.brandName;

  getContactInformation = () => this.data?.productDetails?.contactInformation?.replaceAll('###', '').replace('Yhteystiedot', '');

  getEanCode = () => this.data?.ean;

  getImageUrl360 = () => this.data?.productDetails?.productImages?.mainImage?.urlTemplate?.replace('{MODIFIERS}', 'w360h360@_q75').replace('{EXTENSION}', 'webp');

  getNutrientsEntry = (entryIndex) => this.data?.productDetails?.nutrients?.[entryIndex]?.nutrients;

  getNutrientsReferenceQuantity = (entryIndex) => this.data?.productDetails?.nutrients?.[entryIndex]?.referenceQuantity;
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
  createNameEntry = () => createDataEntry('Nimi', this.dataHandler.getName());

  createDescriptionEntry = () => createDataEntry('Kuvaus', this.dataHandler.getDescription());

  createPriceEntry = () => createDataEntry('Hinta', this.dataHandler.getPriceWithUnit());

  createComparisonPriceEntry = () => createDataEntry(this.#comparisonUnitTitleTable[this.dataHandler.getComparisonUnit()], this.dataHandler.getComparisonPriceWithUnit());

  createIngredientsEntry = () => createDataEntry('Ainesosat', this.dataHandler.getIngredients());

  createStorageGuideForConsumerEntry = () => createDataEntry('Säilytysohje', this.dataHandler.getStorageGuideForConsumer());

  createCountryOfOriginEntry = () => createDataEntry('Valmistusmaa', this.dataHandler.getCountryOfOrigin());

  createBrandNameEntry = () => createDataEntry('Valmistaja', this.dataHandler.getBrandName());

  createContactInformationEntry = () => createDataEntry('Yhteystiedot', this.dataHandler.getContactInformation());

  createEanCodeEntry = () => createDataEntry('EAN Koodi', this.dataHandler.getEanCode());

  createNutrientEntries = (entryIndex) => {
    const nutrients = this.dataHandler.getNutrientsEntry(entryIndex);

    if (!nutrients) {
      return null;
    }
    
    // Create entries of each nutrient entry. Filter out any possible empty entries
    return nutrients.map((entry) => createDataEntry(entry.name, entry.value)).filter((entry) => !!entry);
  };
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