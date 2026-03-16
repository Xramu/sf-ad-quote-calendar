import { LightningElement, track, api } from 'lwc';

export default class AdSpaceSpecificationInfoView extends LightningElement {
  _adSpaceSpecification;

  @track infoSetGroups = [];

  @api
  get adSpaceSpecification() {
    return this._adSpaceSpecification;
  }

  weekdayTranslations = {
    "sunday": "Sunnuntai",
    "monday": "Maanantai",
    "tuesday": "Tiistai",
    "wednesday": "Keskiviikko",
    "thursday": "Torstai",
    "friday": "Perjantai",
    "saturday": "Lauantai",
  }

  set adSpaceSpecification(value) {
    this._adSpaceSpecification = value;

    if (!value) {
      return;
    }

    const sets = [];

    // First section
    sets.push(this.createInfoSet({
      'Nimi': this.adSpaceSpecification?.name,
      'Tila': this.getIsActiveValue(this.adSpaceSpecification?.isActive),
      'Näyttökertojen Arvio': this.adSpaceSpecification?.audienceSizeRating,
      'Tyyppi': this.adSpaceSpecification?.adSpaceType,
      'Paikka': this.adSpaceSpecification?.position,
      'Ohjelma': this.adSpaceSpecification?.programRunType,
      'Tiedotusvälineen Tyyppi': this.adSpaceSpecification?.creativeFormatType,
    }));

    // Second section
    sets.push(this.createInfoSet({
      'Aloituksen Viikonpäivä': this.weekdayTranslations[this.adSpaceSpecification?.startWeekDay?.toLowerCase()],
      'Näyttöpäivät': this.combineStringList(this.adSpaceSpecification?.broadcastDays?.map(day => this.weekdayTranslations[day.toLowerCase()])),
      'Aloituspäivämäärä': this.formatDate(this.adSpaceSpecification?.startDateTime),
      'Lopetuspäivämäärä': this.formatDate(this.adSpaceSpecification?.endDateTime),
      'Osio': this.combineStringList(this.adSpaceSpecification?.section),
      'Alaosio': this.combineStringList(this.adSpaceSpecification?.subSection),
    }));

    // Third section
    const adSpaceProduct = this.adSpaceSpecification?.adSpaceProduct;
    const mediaChannel = this.adSpaceSpecification?.mediaChannel;

    if (adSpaceProduct || mediaChannel) {
      sets.push(this.createInfoSet({
        "Mainostuotteen Nimi": adSpaceProduct?.name,
        "Mainostuotteen Tuotekoodi": adSpaceProduct?.productCode,
        "Mainostuotteen Kuvaus": adSpaceProduct?.description,
        "Mediakanavan Nimi": mediaChannel?.name,
        "Mediakanavan Tyyppi": mediaChannel?.mediaType,
        "Mediakanavan Hintaluokka": mediaChannel?.pricingCategory,
      }));
    }

    this.infoSetGroups = sets;
  }

  createInfoSet(set) {
    return Object.entries(set).map(([label, value]) => ({label, value})).filter(entry => !!entry.value);
  }

  combineStringList(stringList) {
    if (!stringList || !stringList.length) {
      return null;
    }

    return stringList.join('<br>');
  }

  formatDate(dateValue) {
    if (!dateValue) {
      return null;
    }

    try {
      const date = new Date(dateValue);
      return date.toLocaleString('fi-FI', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateValue;
    }
  }

  getIsActiveValue(isActive) {
    if (isActive == null) {
      return null;
    }

    return isActive ? 'Aktiivinen' : 'Ei Aktiivinen'
  }

  get hasInfoSets() {
    return this.infoSetGroups?.length > 0 && this.infoSetGroups?.[0]?.length;
  }
}