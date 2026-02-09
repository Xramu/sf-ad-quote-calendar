import { track, api, LightningElement } from 'lwc';
import { ProductDataManager } from 'c/itemInfoUtils';

export default class SimpleItemInfoVIew extends LightningElement {
  @api eanCode = '';

  @track productImageUrl = '';
  @track productData = [];

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
    // Confirm data
    if (!this.dataManager.hasData()) {
      return;
    }

    // Data entries to show in simple view
    this.productData = [
      this.formatter.createNameEntry(),
      this.formatter.createDescriptionEntry(),
      this.formatter.createEanCodeEntry()
    ].filter((entry) => !!entry);

    // Image
    this.productImageUrl = this.dataManager.getImageUrl360();
  }

  hasProductData() {
    return this.productData.length > 0;
  }
}