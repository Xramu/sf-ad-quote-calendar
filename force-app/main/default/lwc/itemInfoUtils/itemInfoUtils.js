import { track, api, LightningElement } from 'lwc';
import fetchProductDetailsJsonFromEanCode from '@salesforce/apex/EanScraperService.fetchProductDetailsJsonFromEanCode';

export default class ItemInfoUtils extends LightningElement {
  @api eanCode = '';
  
  @track isLoading = false;
  @track hasError = false;
  @track errorMessage = '';
  
  connectedCallback () {
    this.loadProductData();
  }

  flagError(message) {
    this.hasError = true;
    this.errorMessage = message;
    this.sendErrorFlagChangedEvent();
  }

  removeError() {
    this.hasError = false;
    this.errorMessage = '';
    this.sendErrorFlagChangedEvent();
  }

  setLoadingState(state) {
    this.isLoading = state;
    this.sendErrorFlagChangedEvent();
  }

  async loadProductData() {
    // Validate EAN
    if (!this.eanCode) {
      return;
    }

    // Indicate loading
    this.setLoadingState(true);

    try {
      // Fetch and try to parse the received json
      const rawJson = await fetchProductDetailsJsonFromEanCode({ eanCode: (this.eanCode)});
      const parsedData = JSON.parse(rawJson);

      if (parsedData.error) {
        // parsing resulted in an error
        this.flagError('Tuotteen tietoja ei voitu hakea: ' + parsedData.error);
      } else {
        // Pass the data and hope S-Kaupat has not changed the format
        this.sendParsedDataEvent(parsedData);
      }

      // Did not catch exceptions
      this.removeError();
    } catch(e) {
      console.log(e);
      this.flagError('Tuotteen tietoja ei voitu hakea.' + e);
    }

    // Stop loading when complete or ran into an issue
    this.setLoadingState(false);
  }

  sendParsedDataEvent(data) {
    const event = new CustomEvent('dataparsed', {
      detail: { data: data},
      bubbles: true,
      composed: true
    })

    this.dispatchEvent(event);
  }

  sendErrorFlagChangedEvent() {
    const event = new CustomEvent('errorflagchanged', {
      detail: { hasError: this.hasError, errorMessage: this.errorMessage },
      bubbles: true,
      composed: true
    })

    this.dispatchEvent(event);
  }

  sendLoadingStateChangedEvent() {
    const event = new CustomEvent('loadingstatechanged', {
      detail: { isLoading: this.isLoading },
      bubbles: true,
      composed: true
    })

    this.dispatchEvent(event);
  }
}