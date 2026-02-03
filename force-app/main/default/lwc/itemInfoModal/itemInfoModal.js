import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import getHtmlBodyFromUrl from '@salesforce/apex/EanScraperService.getHtmlBodyFromUrl';

export default class ItemInfoModal extends LightningModal {
  @api item;

  @track eanCode;

  connectedCallback() {
    this.updateEanCode();
  }

  updateEanCode() {
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

    // Update child component by setting the ean code
    this.eanCode = parsed.ean;
  }

  get itemCachedName() {
    return this.item.itemName ?? '';
  }

  get modalTitle() {
    return this.item ? `${this.item.itemName} ` : "Lisätiedot";
  }

  handleClose = () => {
    this.close();
  };
}
