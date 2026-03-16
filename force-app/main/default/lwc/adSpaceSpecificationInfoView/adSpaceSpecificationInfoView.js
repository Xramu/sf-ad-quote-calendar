import { LightningElement, track, api } from 'lwc';

export default class AdSpaceSpecificationInfoView extends LightningElement {
  _adSpaceSpecification;

  @track infoSetGroups = [];
  @api recordId; // AdSpaceSpecification Id for updates

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
      'Nimi': { value: this.adSpaceSpecification?.name },
      'Tila': { value: this.getIsActiveValue(this.adSpaceSpecification?.isActive) },
      'Näyttökertojen Arvio': {
        value: this.adSpaceSpecification?.audienceSizeRating,
        editable: true,
        fieldName: 'AudienceSizeRating',
        type: 'number'
      },
      'Tyyppi': { value: this.adSpaceSpecification?.adSpaceType },
      'Paikka': { value: this.adSpaceSpecification?.position },
      'Ohjelma': { value: this.adSpaceSpecification?.programRunType },
      'Tiedotusvälineen Tyyppi': { value: this.adSpaceSpecification?.creativeFormatType },
    }));

    // Second section
    sets.push(this.createInfoSet({
      'Aloituksen Viikonpäivä': { value: this.weekdayTranslations[this.adSpaceSpecification?.startWeekDay?.toLowerCase()] },
      'Näyttöpäivät': { value: this.combineStringList(this.adSpaceSpecification?.broadcastDays?.map(day => this.weekdayTranslations[day.toLowerCase()])) },
      'Aloituspäivämäärä': {
        value: this.formatDate(this.adSpaceSpecification?.startDateTime),
        rawValue: this.adSpaceSpecification?.startDateTime,
        editable: true,
        fieldName: 'StartDateTime',
        type: 'date'
      },
      'Lopetuspäivämäärä': {
        value: this.formatDate(this.adSpaceSpecification?.endDateTime),
        rawValue: this.adSpaceSpecification?.endDateTime,
        editable: true,
        fieldName: 'EndDateTime',
        type: 'date'
      },
      'Osio': { value: this.combineStringList(this.adSpaceSpecification?.section) },
      'Alaosio': { value: this.combineStringList(this.adSpaceSpecification?.subSection) },
    }));

    // Third section
    const adSpaceProduct = this.adSpaceSpecification?.adSpaceProduct;
    const mediaChannel = this.adSpaceSpecification?.mediaChannel;

    if (adSpaceProduct || mediaChannel) {
      sets.push(this.createInfoSet({
        "Mainostuotteen Nimi": { value: adSpaceProduct?.name },
        "Mainostuotteen Tuotekoodi": { value: adSpaceProduct?.productCode },
        "Mainostuotteen Kuvaus": { value: adSpaceProduct?.description },
        "Mediakanavan Nimi": { value: mediaChannel?.name },
        "Mediakanavan Tyyppi": { value: mediaChannel?.mediaType },
        "Mediakanavan Hintaluokka": { value: mediaChannel?.pricingCategory },
      }));
    }

    this.infoSetGroups = sets;
  }

  createInfoSet(set) {
    return Object.entries(set).map(([label, fieldInfo]) => {
      // Support both old format (direct value) and new format (object with metadata)
      const isObject = typeof fieldInfo === 'object' && fieldInfo !== null && !Array.isArray(fieldInfo);
      const type = isObject ? fieldInfo.type : null;
      return {
        label,
        value: isObject ? fieldInfo.value : fieldInfo,
        rawValue: isObject ? fieldInfo.rawValue : null,
        editable: isObject ? fieldInfo.editable : false,
        fieldName: isObject ? fieldInfo.fieldName : null,
        type: type,
        isNumberType: type === 'number',
        isDateType: type === 'date'
      };
    }).filter(entry => entry.value !== null && entry.value !== undefined);
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