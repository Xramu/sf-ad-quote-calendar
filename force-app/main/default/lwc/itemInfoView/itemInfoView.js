import { api, track, LightningElement } from 'lwc';
import { ProductDataManager } from 'c/itemInfoUtils';

export default class ItemInfoView extends LightningElement {
  @api eanCode;
  @api imageWidth;
  @api imageHeight;
  @api detailsToShow;

  @track productImageUrl= '';
  @track productData = [];

  @track productNutrientsReferenceQuantity = '';
  @track productNutrients = [];

  // The data handler that includes the formatter as well
  @track dataManager = new ProductDataManager();

  get formatter() {
    return this.dataManager.formatter;
  }

  get allDetailTags() {
    return 'Image, Nutrients, Name, Description, Price, Comparison Price, Ingredients, Storage Guide, Country of Origin, Brand Name, Contact Information, EAN Code';
  }

  // String to action references, lower case since the input strings are not case sensitive
  get detailEntryActionMap() {
    return {
      'name': () => this.formatter.createNameEntry(),
      'description': () => this.formatter.createDescriptionEntry(),
      'price': () => this.formatter.createPriceEntry(),
      'comparison price': () => this.formatter.createComparisonPriceEntry(),
      'ingredients': () => this.formatter.createIngredientsEntry(),
      'storage guide': () => this.formatter.createStorageGuideForConsumerEntry(),
      'country of origin': () => this.formatter.createCountryOfOriginEntry(),
      'brand name': () => this.formatter.createBrandNameEntry(),
      'contact information': () => this.formatter.createContactInformationEntry(),
      'ean code': () => this.formatter.createEanCodeEntry(),
    }
  }

  async connectedCallback() {
    const success = await this.dataManager.fetchProductData(this.eanCode);
    success ? this.onFetchSuccess() : this.onFetchFail();
  }

  onFetchFail() {
    console.log('Failed fetch');
  }

  onFetchSuccess() {
    this.displayProductData();
  }

  displayProductData() {
    // Confirm data exists
    if (!this.dataManager.hasData()) {
      return;
    }

    // Split into entries, trim, set to lower case and remove empty. Use all tags as fallback
    const details = (this.detailsToShow || this.allDetailTags)
      .split(',')
      .map(str => str.trim().toLowerCase())
      .filter(Boolean);
    
    // Detail String => Entry Creation Function Map
    const actionMap = this.detailEntryActionMap;
    
    // Call create action for each
    this.productData = details
      .map(key => actionMap[key]?.())
      .filter(Boolean);

    // Nutrients
    if (details.includes('nutrients')) {
      this.productNutrients = this.formatter.createNutrientEntries(0);
      this.productNutrientsReferenceQuantity = this.dataManager.getNutrientsReferenceQuantity(0);
    }

    // Image
    if (details.includes('image')) {
      this.productImageUrl = this.dataManager.getImageUrl(this.imageWidth, this.imageHeight);
    }
  }

  get productImageStyle() {
    return `--max-image-width: ${this.imageWidth}px; --max-image-height: ${this.imageHeight}px; color: transparent;`;
  }

  get hasProductData() {
    return this.productData.length > 0;
  }

  get hasProductNutrients() {
    return this.productNutrients.length > 0;
  }
}