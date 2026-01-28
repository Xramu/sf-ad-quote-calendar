import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import getHtmlBodyFromUrl from '@salesforce/apex/EanScraperService.getHtmlBodyFromUrl';

export default class ItemInfoModal extends LightningModal {
  @api item;

  @track productData;
  @track isLoading = false;
  @track hasError = false;

  // Domain start of each product.
  productUrlStart = 'https://www.s-kaupat.fi/tuote/'

  connectedCallback() {
    this.loadProductData();
  }

  async loadProductData() {
    if (!this.item) {
      return;
    }

    // Check for extra data json string
    const raw = this.item?.extraJsonData;
    if (!raw) {
      return;
    }

    // Parse the extra data
    var parsed = {};
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      console.log(e);
      return;
    }

    this.isLoading = true;

    // Get html body from url and scrape it
    await getHtmlBodyFromUrl({ url: (this.productUrlStart + parsed.ean) })
    .then((result) => {
      this.scrapeProductDataFromHtml(result);
    })
    .catch((e) => {
      console.log(e);
    })

    this.isLoading = false;
  }

  getDataTestIdElement(doc, dataTestId) {
    return doc.querySelector('[data-test-id="' + dataTestId + '"]');
  }

  getProductNameFromHtmlBody(doc) {
    const productTitleElement = this.getDataTestIdElement(doc, 'product-name');

    if (!productTitleElement) {
      return 'Nimeä ei voitu löytää.';
    }

    return productTitleElement.textContent;
  }

  getProductDescriptionFromHtmlBody(doc) {
    const productDescriptionElement = this.getDataTestIdElement(doc, 'product-info-description').querySelector('div div span p');

    if (!productDescriptionElement) {
      return 'Kuvausta ei voitu löytää.'
    }

    return productDescriptionElement.textContent;
  }

  getProductCountryOfOriginFromHtmlBody(doc) {
    const productCountryOfOriginElement = this.getDataTestIdElement(doc, 'product-info-country').querySelector('[class="sc-186ce282-2 bCfrWu"]');

    if (!productCountryOfOriginElement) {
      return 'Valmistusmaata ei voitu löytää.';
    }

    return productCountryOfOriginElement.textContent;
  }

  scrapeProductDataFromHtml(htmlString) {
    const parser = new DOMParser();

    const doc = parser.parseFromString(htmlString, 'text/html');

    this.productData = {
      productName: this.getProductNameFromHtmlBody(doc),
      productDescription: this.getProductDescriptionFromHtmlBody(doc),
      productCountryOfOrigin: this.getProductCountryOfOriginFromHtmlBody(doc),
    };
  }

  get errorMessage() {
    return this.productData?.errorMessage;
  }

  get productName() {
    return this.productData?.productName;
  }

  get productDescription() {
    return this.productData?.productDescription;
  }

  get productCountryOfOrigin() {
    return this.productData?.productCountryOfOrigin;
  }

  get modalTitle() {
    return this.item ? `${this.item.itemName} ` : "Lisätiedot";
  }

  handleClose = () => {
    this.close();
  };
}
