/**
 * Details View (right pane)
 * - Loads campaigns for selected week/year via Apex
 * - Renders list of campaigns with colored buttons
 * - Auto-selects single campaign and opens edit form
 * - Saves on blur via lightning-record-edit-form submit
 *
 * Notes:
 * - No template expressions/concatenation in HTML per project rules
 * - Colors reflect ownership (current user vs others)
 */
import { LightningElement, api, track } from 'lwc';
import getWeekCampaigns from '@salesforce/apex/AdCampaignCalendarService.getWeekCampaigns';
import saveCampaign from '@salesforce/apex/AdCampaignCalendarService.saveCampaign';

export default class DetailsView extends LightningElement {
  @api year;
  @api weekNumber;
  @api campaignId; // optionally preselected from parent

  @track campaigns = [];
  @track selectedCampaignId = null;

  // Local editable state
  @track nameValue = '';
  @track descriptionValue = '';
  @track isSaving = false;

  // Derived display fields (status/time period) resolved from selected campaign
  get hasWeek() {
    return !!this.weekNumber;
  }
  get hasCampaigns() {
    return Array.isArray(this.campaigns) && this.campaigns.length > 0;
  }

  // React to external changes
  renderedCallback() {
    // no-op
  }

  set weekNumber(value) {
    this._weekNumber = value;
    this.loadWeek();
  }
  get weekNumber() {
    return this._weekNumber;
  }

  set campaignId(value) {
    this._campaignId = value || null;
    if (this._campaignId) {
      this.selectedCampaignId = this._campaignId;
      // Initialize form values from the selected campaign when campaignId is set externally
      this.hydrateFormFromSelection();
    }
  }
  get campaignId() {
    return this._campaignId;
  }

  async loadWeek() {
    this.campaigns = [];
    this.selectedCampaignId = null;

    if (!this.year || !this.weekNumber) {
      return;
    }
    try {
      const list = await getWeekCampaigns({ year: this.year, weekNumber: this.weekNumber });
      this.campaigns = Array.isArray(list) ? list : [];

      if (this.campaigns.length > 0) {
        // Select first campaign by default
        this.selectedCampaignId = this.campaigns[0].id;
        // Initialize form values from the selected campaign
        this.hydrateFormFromSelection();
        // Notify parent of auto-selection
        this.dispatchEvent(
          new CustomEvent('campaignselected', {
            detail: { campaignId: this.selectedCampaignId },
            bubbles: true,
            composed: true
          })
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load week campaigns', e);
      this.campaigns = [];
      this.selectedCampaignId = null;
    }
  }

  // List item helpers
  getItemClass(c) {
    const base = ['list-item'];
    if (c && c.id === this.selectedCampaignId) {
      base.push('selected');
    }

    if (c && c.hasCurrentUserCampaign) {
      base.push('owned');
    } else {
      base.push('other-btn');
    }
    return base.join(' ');
  }

  get campaignsWithClasses() {
    return this.campaigns.map(campaign => ({
      ...campaign,
      itemClass: this.getItemClass(campaign)
    }));
  }

  handleSelect = (evt) => {
    const id = evt.currentTarget?.dataset?.id;
    if (!id) return;
    this.selectedCampaignId = id;
    // populate inputs from current selected campaign
    this.hydrateFormFromSelection();
    this.dispatchEvent(
      new CustomEvent('campaignselected', {
        detail: { campaignId: id },
        bubbles: true,
        composed: true
      })
    );
  };

  handleItemKeydown = (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      this.handleSelect(evt);
    }
  };

  // Manual input handlers and save
  handleNameChange = (evt) => {
    this.nameValue = evt.detail?.value;
  };

  handleDescriptionChange = (evt) => {
    this.descriptionValue = evt.detail?.value;
  };

  async handleSave() {
    if (!this.selectedCampaignId) return;
    try {
      this.isSaving = true;
      console.log(this.selectedCampaignId);
      const updated = await saveCampaign({
        recordId: this.selectedCampaignId,
        campaignName: this.nameValue,
        description: this.descriptionValue
      });
      // Update local list with returned dto
      this.mergeUpdatedCampaign(updated);
      // Refresh list from server to sync derived flags and texts
      await this.loadWeek();
      // Keep selection after refresh
      this.selectedCampaignId = updated?.id || this.selectedCampaignId;
      this.hydrateFormFromSelection();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to save campaign', e);
    } finally {
      this.isSaving = false;
    }
  }

  // Display helpers (read-only)
  get statusText() {
    const sel = this.campaigns.find((c) => c.id === this.selectedCampaignId);
    return sel?.status || '—';
  }

  get timePeriodText() {
    const sel = this.campaigns.find((c) => c.id === this.selectedCampaignId);
    if (!sel || !sel.startDate || !sel.endDate) return '—';
    return `${this.formatDate(sel.startDate)} - ${this.formatDate(sel.endDate)}`;
  }

  formatDate(d) {
    // d is a Date in Apex-serialized form; treat as YYYY-MM-DD
    try {
      const s = String(d);
      const parts = s.split('-');
      const yyyy = parts.length > 0 ? parts[0] : null;
      const mm = parts.length > 1 ? parts[1] : null;
      const dd = parts.length > 2 ? parts[2] : null;
      if (!yyyy || !mm || !dd) return s;
      return [dd, mm, yyyy].join('.');
    } catch (e) {
      return String(d);
    }
  }

  hydrateFormFromSelection() {
    const sel = this.campaigns.find((c) => c.id === this.selectedCampaignId);
    // Default to empty strings per project rules (no inline concatenation)
    this.nameValue = sel?.name || '';
    this.descriptionValue = sel?.description || '';
  }

  mergeUpdatedCampaign(updated) {
    if (!updated) return;
    const idx = this.campaigns.findIndex((c) => c.id === updated.id);
    if (idx >= 0) {
      const copy = [...this.campaigns];
      copy[idx] = {
        ...copy[idx],
        name: updated.name,
        status: updated.status,
        startDate: updated.startDate,
        endDate: updated.endDate,
        ownerUserId: updated.ownerUserId,
        hasCurrentUserCampaign: updated.hasCurrentUserCampaign
      };
      this.campaigns = copy;
    }
  }
}
