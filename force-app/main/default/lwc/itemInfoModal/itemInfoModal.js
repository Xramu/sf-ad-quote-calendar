import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import getHtmlBodyFromUrl from '@salesforce/apex/EanScraperService.getHtmlBodyFromUrl';

export default class ItemInfoModal extends LightningModal {
  @api item;

  // Debug purposes the whole body of the product page.
  @track productPageHtml = '';

  // Domain start of each product.
  productUrlStart = 'https://www.s-kaupat.fi/tuote/'

  connectedCallback() {
    this.loadProductPageHtml();
  }

  async loadProductPageHtml() {
    if (!this.item) {
      this.productPageHtml = 'Could not find product.';
      return;
    }

    // Check for extra data json string
    const raw = this.item?.extraJsonData;
    if (!raw) {
      this.productPageHtml = 'Could not find product extra data.';
      return;
    }

    // Parse the extra data
    var parsed = {};
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      console.log(e);
      this.productPageHtml = 'Could not parse product extra data.';
      return;
    }

    getHtmlBodyFromUrl({ url: (this.productUrlStart + parsed.ean) })
      .then((result) => {
        this.productPageHtml = result;
      })
      .catch((e) => {
        this.productPageHtml = e.body.message;
        console.log(e);
      })

    this.productPageHtml = htmlBody;
  }

  get modalTitle() {
    return this.item ? `${this.item.itemName} ` : "Lisätiedot";
  }

  handleClose = () => {
    this.close();
  };
}
