import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import getHtmlBodyFromUrl from '@salesforce/apex/EanScraperService.getHtmlBodyFromUrl';

export default class ItemInfoModal extends LightningModal {
  @api item;
  
  get eanCode() {
    console.log(this.item);
    return this.item.ean;
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
