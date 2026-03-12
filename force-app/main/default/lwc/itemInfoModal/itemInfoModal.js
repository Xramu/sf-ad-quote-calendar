import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ItemInfoModal extends LightningModal {
  @api item;

  get detailsToShow() {
    return 'Image, Nutrients, Name, Description, Price, Comparison Price, Ingredients, Storage Guide, Country of Origin, Brand Name, Contact Information, EAN Code';
  }  
  get eanCode() {
    return this.item.ean;
  }

  get itemCachedName() {
    return this.item.itemName ?? '';
  }

  get modalTitle() {
    return this.item?.itemName || "Lisätiedot";
  }

  get adSpaceSpecification() {
    this.item?.adSpaceSpecification;
  }

  handleClose = () => {
    this.close();
  };
}
