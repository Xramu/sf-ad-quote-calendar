import { LightningElement, api } from 'lwc';

export default class AdSpaceSpecificationInfoView extends LightningElement {
  @api adSpaceSpecification;

  get adSpaceSpecificationName() {
    return this.adSpaceSpecification?.name ?? 'Nimeä ei löytynyt.';
  }
}