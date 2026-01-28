import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ItemInfoModal extends LightningModal {
  @api item;

  errorMessage = 'Tuotteen tietojen lataaminen epäonnistui';
  get extraDataJson() {
    const raw = this.item?.extraJsonData;
    if (!raw) return this.errorMessage;

    try {
      return typeof raw === 'string' ? JSON.stringify(JSON.parse(raw)) : raw;
    } catch (e) {
      console.log(e);
      return this.errorMessage;
    }
  }

  get modalTitle() {
    return this.item ? `${this.item.itemName} ` : "Lisätiedot";
  }

  handleClose = () => {
    this.close();
  };
}
