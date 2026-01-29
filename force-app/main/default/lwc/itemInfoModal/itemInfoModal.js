import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import getHtmlBodyFromUrl from '@salesforce/apex/EanScraperService.getHtmlBodyFromUrl';

export default class ItemInfoModal extends LightningModal {
  @api item;

  @track productData;
  @track isLoading = false;
  @track hasError = false;

  // Domain start of each product.
  productUrlStart = 'https://www.s-kaupat.fi/tuote/'

  connectedCallback() {
    this.loadProductData();
  }

  async loadProductData() {
    if (!this.item) {
      return;
    }

    // Check for extra data json string
    const raw = this.item?.extraJsonData;
    if (!raw) {
      return;
    }

    // Parse the extra data
    var parsed = {};
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      console.log(e);
      return;
    }

    this.isLoading = true;

    // Get html body from url and scrape it
    await getHtmlBodyFromUrl({ url: (this.productUrlStart + parsed.ean) })
    .then((result) => {
      this.scrapeProductDataFromHtml(result);
    })
    .catch((e) => {
      console.log(e);
    })

    this.isLoading = false;
  }

  parseProductDataFromHtmlString(htmlString) {
    const startMarker = '<script id="__NEXT_DATA__" type="application/json">';
    const startIdx = htmlString.indexOf(startMarker);

    console.log(htmlString);

    if (startIdx === -1) return {error: 'Failed to find start marker in html string'};

    try {
      const jsonStart = startIdx + startMarker.length;
      const jsonEnd = htmlString.indexOf('</script>', jsonStart);

      const rawJson = htmlString.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(rawJson);

      // Find the root of the product and the product key
      const apolloState = parsed.props.pageProps.apolloState;
      const productKey = Object.keys(apolloState).find(key => key.startsWith('Product:'));

      // No product key found
      if (!productKey) {
        return {error: 'Failed to find product key in apollo state'};
      }

      // Product key found, return data behind it
      const productData = apolloState[productKey];
      return productData;
    } catch (e) {
      console.log(e);
    }

    return {error: 'Failed to parse product data from html string'};
  }

  scrapeProductDataFromHtml(htmlString) {
    var pName = 'Tuotteen nimeä ei löytynyt.';
    var pDesc = 'Tuotteen kuvausta ei löytynyt.';
    var pCoO = 'Tuotteen valmistusmaata ei löytynyt.';

    const parsedData = this.parseProductDataFromHtmlString(htmlString);

    console.log(parsedData);

    if (!parsedData.error) {
      pName = parsedData.name ?? pName;
      pDesc = parsedData.description ?? pDesc;
      pCoO = parsedData.countryName.fi ?? pCoO;
    }

    this.productData = {
      productName: pName,
      productDescription: pDesc,
      productCountryOfOrigin: pCoO,
    };
  }

  get errorMessage() {
    return this.productData?.errorMessage;
  }

  get productName() {
    return this.productData?.productName;
  }

  get productDescription() {
    return this.productData?.productDescription;
  }

  get productCountryOfOrigin() {
    return this.productData?.productCountryOfOrigin;
  }

  get modalTitle() {
    return this.item ? `${this.item.itemName} ` : "Lisätiedot";
  }

  handleClose = () => {
    this.close();
  };
}
