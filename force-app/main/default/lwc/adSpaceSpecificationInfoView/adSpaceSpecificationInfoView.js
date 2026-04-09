import { LightningElement, track, api } from 'lwc';

export default class AdSpaceSpecificationInfoView extends LightningElement {
  _adSpaceSpecification;
  _inEnglish = false;

  @track infoSetGroups = [];
  @api recordId; // AdSpaceSpecification Id for updates
  
  weekdayTranslations = {
    "sunday": "Sunnuntai",
    "monday": "Maanantai",
    "tuesday": "Tiistai",
    "wednesday": "Keskiviikko",
    "thursday": "Torstai",
    "friday": "Perjantai",
    "saturday": "Lauantai",
  }

  @api
  get inEnglish() {
    return this._inEnglish;
  }

  set inEnglish(value) {
    this._inEnglish = value;
    this.refreshInfoSets();
  }

  @api
  get adSpaceSpecification() {
    return this._adSpaceSpecification;
  }

  set adSpaceSpecification(value) {
    this._adSpaceSpecification = value;
    this.refreshInfoSets();
  }

  refreshInfoSets() {
    if (!this._adSpaceSpecification) {
      this.infoSetGroups = [];
      return;
    }

    // Translated titles (This is quite the mess)
    const titles = this.inEnglish ?
    {
      name: 'Name',
      activityState: 'State',
      audienceSizeRating: 'Audience Size Rating',
      adSpaceType: 'Ad Space Type',
      position: 'Position',
      programRunType: 'Program Run Type',
      creativeFormatType: 'Creative Format Type',
      startWeekDay: 'Start Week Day',
      broadcastDays: 'Broadcast Days',
      startDateTime: 'Start Date',
      endDateTime: 'End Date',
      section: 'Section',
      subSection: 'Subsection',
      productName: 'Product Name',
      productCode: 'Product Code',
      productDescription: 'Product Description',
      channelName: 'Media Channel Name',
      channelMediaType: 'Media Channel Type',
      channelPricingCategory: 'Media Channel Pricing Category',
    } :
    {
      name: 'Nimi',
      activityState: 'Tila',
      audienceSizeRating: 'Näyttökertojen Arvio',
      adSpaceType: 'Tyyppi',
      position: 'Paikka',
      programRunType: 'Ohjelma',
      creativeFormatType: 'Tiedotusvälineen Tyyppi',
      startWeekDay: 'Aloituksen Viikonpäivä',
      broadcastDays: 'Näyttöpäivät',
      startDateTime: 'Aloituspäivämäärä',
      endDateTime: 'Lopetuspäivämäärä',
      section: 'Osio',
      subSection: 'Alaosio',
      productName: 'Mainostuotteen Nimi',
      productCode: 'Mainostuotteen Tuotekoodi',
      productDescription: 'Mainostuotteen Kuvaus',
      channelName: 'Mediakanavan Nimi',
      channelMediaType: 'Mediakanavan Tyyppi',
      channelPricingCategory: 'Mediakanavan Hintaluokka',
    };

    const sets = [];

    // First section
    sets.push(this.createInfoSet({
      [titles.name]: { value: this.adSpaceSpecification?.name },
      [titles.activityState]: { value: this.getIsActiveValue(this.adSpaceSpecification?.isActive) },
      [titles.audienceSizeRating]: {
        value: this.adSpaceSpecification?.audienceSizeRating,
        editable: true,
        fieldName: 'AudienceSizeRating',
        type: 'number'
      },
      [titles.adSpaceType]: { value: this.adSpaceSpecification?.adSpaceType },
      [titles.position]: { value: this.adSpaceSpecification?.position },
      [titles.programRunType]: { value: this.adSpaceSpecification?.programRunType },
      [titles.creativeFormatType]: { value: this.adSpaceSpecification?.creativeFormatType },
    }));

    // Second section
    sets.push(this.createInfoSet({
      [titles.startWeekDay]: { value:
        this.inEnglish ?
          this.adSpaceSpecification?.startWeekDay :
          this.weekdayTranslations[this.adSpaceSpecification?.startWeekDay?.toLowerCase()] },
      [titles.broadcastDays]: { value:
        this.inEnglish ?
        this.combineStringList(this.adSpaceSpecification?.broadcastDays) :
        this.combineStringList(this.adSpaceSpecification?.broadcastDays?.map(day => this.weekdayTranslations[day.toLowerCase()])) },
      [titles.startDateTime]: {
        value: this.formatDate(this.adSpaceSpecification?.startDateTime),
        rawValue: this.adSpaceSpecification?.startDateTime,
        editable: true,
        fieldName: 'StartDateTime',
        type: 'date'
      },
      [titles.endDateTime]: {
        value: this.formatDate(this.adSpaceSpecification?.endDateTime),
        rawValue: this.adSpaceSpecification?.endDateTime,
        editable: true,
        fieldName: 'EndDateTime',
        type: 'date'
      },
      [titles.section]: { value: this.combineStringList(this.adSpaceSpecification?.section) },
      [titles.subSection]: { value: this.combineStringList(this.adSpaceSpecification?.subSection) },
    }));

    // Third section
    const adSpaceProduct = this.adSpaceSpecification?.adSpaceProduct;
    const mediaChannel = this.adSpaceSpecification?.mediaChannel;

    if (adSpaceProduct || mediaChannel) {
      sets.push(this.createInfoSet({
        [titles.productName]: { value: adSpaceProduct?.name },
        [titles.productCode]: { value: adSpaceProduct?.productCode },
        [titles.productDescription]: { value: adSpaceProduct?.description },
        [titles.channelName]: { value: mediaChannel?.name },
        [titles.channelMediaType]: { value: mediaChannel?.mediaType },
        [titles.channelPricingCategory]: { value: mediaChannel?.pricingCategory },
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

    if (this.inEnglish) {
      return isActive ? 'Active' : 'Inactive';
    }

    return isActive ? 'Aktiivinen' : 'Ei Aktiivinen';
  }

  get hasInfoSets() {
    return this.infoSetGroups?.length > 0 && this.infoSetGroups?.[0]?.length;
  }

  handleFieldUpdate(event) {
    const { updatedRecord } = event.detail;

    // Update the internal specification object with the full updated record from Apex
    if (updatedRecord && this._adSpaceSpecification) {
      this._adSpaceSpecification = updatedRecord;

      // Refresh the UI to show all updated values (including auto-calculated fields)
      this.refreshInfoSets();
    }
  }
}