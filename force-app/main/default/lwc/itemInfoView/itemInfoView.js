import { api, track, LightningElement } from 'lwc';
import { ProductDataManager } from 'c/itemInfoUtils';

export default class ItemInfoView extends LightningElement {
  
  @api eanCode;

  @track productImageUrl= '';
  @track productData = [];

  @track productNutrientsReferenceQuantity = '';
  @track productNutrients = [];

  // The data handler that includes the formatter as well
  @track dataManager = new ProductDataManager();

  get formatter() {
    return this.dataManager.formatter;
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

    // Add main data entries (Left Side) filter out possibly missing fields
    this.productData = [
      this.formatter.createNameEntry(),
      this.formatter.createDescriptionEntry(),
      this.formatter.createPriceEntry(),
      this.formatter.createComparisonPriceEntry(),
      this.formatter.createIngredientsEntry(),
      this.formatter.createStorageGuideForConsumerEntry(),
      this.formatter.createCountryOfOriginEntry(),
      this.formatter.createBrandNameEntry(),
      this.formatter.createContactInformationEntry(),
      this.formatter.createEanCodeEntry()
    ].filter((entry) => !!entry);

    // Nutrients
    this.productNutrients = this.formatter.createNutrientEntries(0);

    // Nutrients reference quantity
    this.productNutrientsReferenceQuantity = this.dataManager.getNutrientsReferenceQuantity(0);

    // Image
    this.productImageUrl = this.dataManager.getImageUrl360();
  }

  get hasProductData() {
    return this.productData.length > 0;
  }

  get hasProductNutrients() {
    return this.productNutrients.length > 0;
  }
}