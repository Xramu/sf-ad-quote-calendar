import { LightningElement, api } from 'lwc';

export default class ItemInfoField extends LightningElement {
    @api label;
    @api value;

    get displayValue() {
        return this.value ?? '-';
    }
}
