import { api, track, LightningElement } from 'lwc';
import { fetchProductData } from 'c/itemInfoUtils';

export default class ItemInfoView extends LightningElement {
  
  @api eanCode;

  @track productImageUrl= '';
  @track productData = [];

  @track productNutrientsReferenceQuantity = '';
  @track productNutrients = [];

  @track isLoading = false;
  @track hasError = false;
  @track errorMessage = '';

  async connectedCallback() {
    this.isLoading = true;
    
    await this.tryFetchAndDisplay();

    this.isLoading = false;
  }

  async tryFetchAndDisplay() {
    try {
      const data = await fetchProductData(this.eanCode);

      this.hasError = !!data.error;

      if (this.hasError) {
        this.errorMessage = data.error;
        return;
      }

      // No errors found
      this.displayProductData(data);
    } catch (e) {
      console.log(e);
    }
  }

  displayProductData(data) {
    if (!data) {
      return;
    }

    // Sub data
    const productDetails = data.productDetails;
    const productImages = productDetails.productImages;

    // Info we are exposing in the modal
    this.addProductDataEntry('Nimi', data.name);

    // Price and price unit
    if (data.price && data.priceUnit) {
      this.addProductDataEntry('Hinta', `${data.price}€ ${data.priceUnit}`);
    }

    // Comparison price
    if (data.comparisonPrice && data.comparisonUnit && !data.comparisonUnit.localeCompare('KGM')) {
      this.addProductDataEntry('Kilohinta', `${data.comparisonPrice}€/kg`)
    }

    this.addProductDataEntry('Kuvaus', data.description);

    this.addProductDataEntry('Ainesosat', data.ingredientStatement);
    this.addProductDataEntry('Säilytysohje', productDetails.storageGuideForConsumer);
    
    this.addProductDataEntry('Valmistusmaa', data.countryName.fi);
    this.addProductDataEntry('Valmistaja', data.brandName);

    // Contact information cleanup
    if (productDetails.contactInformation) {
      this.addProductDataEntry('Yhteystiedot', productDetails.contactInformation.replaceAll('###', '').replace('Yhteystiedot', ''));
    }

    this.addProductDataEntry('EAN Koodi', data.ean);

    // Nutrients
    this.updateProductNutrients(productDetails);

    // Image URL build
    if (productImages.mainImage.urlTemplate) {
      this.productImageUrl = productImages.mainImage.urlTemplate.replace('{MODIFIERS}', 'w360h360@_q75').replace('{EXTENSION}', 'webp');
    }
  }

  addProductDataEntry(title, value) {
    if (!value) {
      console.log(`Value of ${title} data entry is null or undefined`);
      return;
    }

    this.productData.push({
      title: title,
      value: value
    });
  }

  addProductNutrientsEntry(title, value) {
    if (!title || !value) {
      console.log(`Invalid nutrient entry with the title: ${title} and value: ${value}`);
      return;
    }

    this.productNutrients.push({
      title: title,
      value: value
    });
  }

  updateProductNutrients(productDetails) {
    if (!productDetails || !productDetails.nutrients || !productDetails.nutrients[0]) {
      this.productNutrients = [];
      return;
    }

    // Goofy structure but it is what it is
    const nutrients = productDetails.nutrients[0].nutrients;

    // Set the quantity reference
    this.productNutrientsReferenceQuantity = productDetails.nutrients[0].referenceQuantity;

    // Push each entry to the nutrients array
    nutrients.map((entry) => {
      if (entry.name !== undefined && entry.value !== undefined) {
        this.addProductNutrientsEntry(entry.name, entry.value);
      }
    });
  }

  get hasProductData() {
    return this.productData.length > 0;
  }

  get hasProductNutrients() {
    return this.productNutrients.length > 0;
  }
}