import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ItemInfoModal extends LightningModal {
  @api item;
  @api inEnglish = false;

  get detailsToShow() {
    return 'Image, Nutrients, Name, Description, Price, Comparison Price, Ingredients, Storage Guide, Country of Origin, Brand Name, Contact Information, EAN Code';
  }  
  get eanCode() {
    return this.item.ean;
  }

  get adSpaceSpecificationRecordId() {
    return this.item?.adSpaceSpecification?.id;
  }

  get itemCachedName() {
    return this.item.itemName ?? '';
  }

  get modalTitle() {
    return this.item?.itemName || (this.inEnglish ? 'Details' : "Lisätiedot");
  }

  get adSpaceSpecTitle() {
    return this.inEnglish ? 'Ad Space Specifications' : 'Mainostilan Tiedot';
  }

  get productDetailsTitle() {
    return this.inEnglish ? 'Product Details' : 'Tuotteen Tiedot';
  }

  get closeButtonLabelText() {
    return this.inEnglish ? 'Close' : 'Sulje';
  }

  handleClose = () => {
    this.close();
  };
}
