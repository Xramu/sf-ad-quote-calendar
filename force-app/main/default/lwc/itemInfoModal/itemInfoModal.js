import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import getHtmlBodyFromUrl from '@salesforce/apex/EanScraperService.getHtmlBodyFromUrl';

export default class ItemInfoModal extends LightningModal {
  @api item;

  @track productData = [];
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

  addProductDataEntry(title, value) {
    if (!value) {
      console.log(`Value of ${title} data entry is null or undefined`);
      return;
    }

    this.productData.push({
      title: title,
      value: value
    });
  }

  scrapeProductDataFromHtml(htmlString) {
    // Clear product data in case some of the previously shown data was not found.
    this.productData = [];

    const parsedData = this.parseProductDataFromHtmlString(htmlString);

    if (parsedData.error) {
      console.log(parsedData.error);
      this.hasError = true;
      return;
    }

    this.hasError = false;

    // Sub data
    const productDetails = parsedData.productDetails;

    // Info we are exposing in the modal
    this.addProductDataEntry('Nimi', parsedData.name);

    // Price and price unit
    if (parsedData.price && parsedData.priceUnit) {
      this.addProductDataEntry('Hinta', `${parsedData.price}€ ${parsedData.priceUnit}`);
    }

    // Comparison price
    if (parsedData.comparisonPrice && parsedData.comparisonUnit && !parsedData.comparisonUnit.localeCompare('KGM')) {
      this.addProductDataEntry('Kilohinta', `${parsedData.comparisonPrice}€/kg`)
    }

    this.addProductDataEntry('Kuvaus', parsedData.description);

    this.addProductDataEntry('Ainesosat', parsedData.ingredientStatement);
    this.addProductDataEntry('Säilytysohje', productDetails.storageGuideForConsumer);
    
    this.addProductDataEntry('Valmistusmaa', parsedData.countryName.fi);
    this.addProductDataEntry('Valmistaja', parsedData.brandName);

    // Contact information cleanup
    if (productDetails.contactInformation) {
      this.addProductDataEntry('Yhteystiedot', productDetails.contactInformation.replaceAll('###', '').replace('Yhteystiedot', ''));
    }

    this.addProductDataEntry('EAN Koodi', parsedData.ean);
  }

  get modalTitle() {
    return this.item ? `${this.item.itemName} ` : "Lisätiedot";
  }

  handleClose = () => {
    this.close();
  };
}
