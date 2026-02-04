import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ItemInfoModal extends LightningModal {
  @api item;
  
  get eanCode() {
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
