import { LightningElement, api } from 'lwc';
import updateAdSpaceSpecification from '@salesforce/apex/AdCampaignCalendarService.updateAdSpaceSpecification';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ItemInfoFieldEditableDate extends LightningElement {
    @api label;
    @api value; // Datetime value (formatted string for display)
    @api rawValue; // Raw datetime value from Salesforce
    @api recordId;
    @api fieldName;

    isEditing = false;
    editValue;
    isSaving = false;

    handleEdit() {
        this.isEditing = true;
        // Use rawValue if available, otherwise try to parse the formatted value
        if (this.rawValue) {
            try {
                const date = new Date(this.rawValue);
                this.editValue = this.formatDateTimeLocal(date);
            } catch (e) {
                this.editValue = '';
            }
        } else if (this.value) {
            try {
                // Fallback: Parse the Finnish formatted date back to ISO
                const date = this.parseFinishDate(this.value);
                if (date) {
                    // Format as ISO datetime-local (YYYY-MM-DDTHH:mm)
                    this.editValue = this.formatDateTimeLocal(date);
                }
            } catch (e) {
                this.editValue = '';
            }
        } else {
            this.editValue = '';
        }
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
            // Convert datetime-local to ISO string for Salesforce
            let datetimeValue = null;
            if (this.editValue) {
                const date = new Date(this.editValue);
                datetimeValue = date.toISOString();
            }

            const result = await updateAdSpaceSpecification({
                recordId: this.recordId,
                fieldName: this.fieldName,
                fieldValue: datetimeValue
            });

            // Update the value from the server response
            if (this.fieldName === 'StartDateTime') {
                this.rawValue = result.startDateTime;
                this.value = this.formatDate(result.startDateTime);
            } else if (this.fieldName === 'EndDateTime') {
                this.rawValue = result.endDateTime;
                this.value = this.formatDate(result.endDateTime);
            }

            this.isEditing = false;
            this.editValue = null;

            this.showToast('Success', 'Field updated successfully', 'success');

            // Dispatch custom event to notify parent component
            this.dispatchEvent(new CustomEvent('fieldupdate', {
                detail: { fieldName: this.fieldName, newValue: this.value, rawValue: this.rawValue }
            }));
        } catch (error) {
            this.showToast('Error', error.body?.message || 'Error updating field', 'error');
        } finally {
            this.isSaving = false;
        }
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

    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    parseFinishDate(dateString) {
        // Parse Finnish format: "DD.MM.YYYY, HH:mm"
        const parts = dateString.split(',');
        if (parts.length !== 2) return null;

        const dateParts = parts[0].trim().split('.');
        const timeParts = parts[1].trim().split(':');

        if (dateParts.length !== 3 || timeParts.length !== 2) return null;

        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);

        return new Date(year, month, day, hours, minutes);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

    get displayValue() {
        return this.value || '';
    }
}
