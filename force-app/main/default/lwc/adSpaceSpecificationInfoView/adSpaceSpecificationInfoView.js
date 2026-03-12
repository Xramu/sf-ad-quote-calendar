import { LightningElement, track, api } from 'lwc';

export default class AdSpaceSpecificationInfoView extends LightningElement {
  _adSpaceSpecification;
  @track infoSets = [];

  @api
  get adSpaceSpecification() {
    return this._adSpaceSpecification;
  }

  set adSpaceSpecification(value) {
    this._adSpaceSpecification = value;

    if (!value) {
      return;
    }

    // Reset info sets
    this.infoSets = [];

    this.addInfoSetPair('Nimi', this.adSpaceSpecification?.name);
    // this.addInfoSetPair('Tyyppi', this.adSpaceSpecification?.type);
    this.addInfoSetPair('Tila', this.getIsActiveValue(this.adSpaceSpecification?.isActive));
    this.addInfoSetPair('Näyttökertojen Arvio', this.adSpaceSpecification?.audienceSizeRating);
    this.addInfoSetPair('Tyyppi', this.adSpaceSpecification?.adSpaceType);
    this.addInfoSetPair('Paikka', this.adSpaceSpecification?.position);
    this.addInfoSetPair('Ohjelma', this.adSpaceSpecification?.programRunType);
    this.addInfoSetPair('Tiedotusvälineen Tyyppi', this.adSpaceSpecification?.creativeFormatType);
  }

  getIsActiveValue(isActive) {
    if (isActive == null) {
      return null;
    }

    return isActive ? 'Aktiivinen' : 'Ei Aktiivinen'
  }

  addInfoSetPair(label, value) {
    // Return null that will be filtered out
    if (!label || !value) {
      return null;
    }

    this.infoSets.push({ label, value })
  }

  get hasInfoSets() {
    return this.infoSets?.length > 0;
  }
}