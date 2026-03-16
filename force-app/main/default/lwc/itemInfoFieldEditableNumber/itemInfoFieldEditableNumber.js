import { LightningElement, api } from 'lwc';
import updateAdSpaceSpecification from '@salesforce/apex/AdCampaignCalendarService.updateAdSpaceSpecification';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ItemInfoFieldEditableNumber extends LightningElement {
    @api label;
    @api value;
    @api recordId;
    @api fieldName;

    isEditing = false;
    editValue;
    isSaving = false;

    handleEdit() {
        this.isEditing = true;
        this.editValue = this.value;
    }

    handleCancel() {
        this.isEditing = false;
        this.editValue = null;
    }

    handleChange(event) {
        this.editValue = event.target.value;
    }

    async handleSave() {
        if (!this.recordId || !this.fieldName) {
            this.showToast('Error', 'Missing record ID or field name', 'error');
            return;
        }

        this.isSaving = true;

        try {
            const result = await updateAdSpaceSpecification({
                recordId: this.recordId,
                fieldName: this.fieldName,
                fieldValue: this.editValue ? String(this.editValue) : null
            });

            // Update the value from the server response
            this.value = result.audienceSizeRating;
            this.isEditing = false;
            this.editValue = null;

            this.showToast('Success', 'Field updated successfully', 'success');

            // Dispatch custom event to notify parent component with full updated record
            this.dispatchEvent(new CustomEvent('fieldupdate', {
                detail: {
                    fieldName: this.fieldName,
                    newValue: this.value,
                    updatedRecord: result
                },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            this.showToast('Error', error.body?.message || 'Error updating field', 'error');
        } finally {
            this.isSaving = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

    get displayValue() {
        return this.value != null ? this.value : '';
    }
}
