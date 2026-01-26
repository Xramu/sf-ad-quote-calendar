## Task Description

Edit the current AdQuoteCalendar Lightning Web Component to add in the support to show each campaign's items inside the DetailsView child LWC pane.

Do not change how the current campaign loading works for each week. Find a way to load all of the `AdWebCartItem__c` records to DetailsView and show them inside the Edit View when the campaign that they are assigned to is selected.

The items should just be shown, they do not need to be editable in any form inside the Edit View.

Files that you should go through for the context of the project include:
- Apex class: AdCampaignCalendarService
- Lightning Web Components: AdQuoteCalendar, CalendarView, DetailsView

## Object References

### Ad Web Cart Item

Custom Object `AdWebCartItem__c` function:
- Works as a child object to `AdWebCart__c` record.
- The assigned `AdWebCart__c` is the campaign this item/product belongs to.
- Has a name field for quick identification of the item in the UI.
- Includes some extra configurations for the cart item in JSON format.

`AdWebCartItem__c` fields:
- `Cart__c`: Reference to the `AdWebCart__c` record that this item is a child of.
- `ItemName__c`: Human readable name of this cart item. Should be used as the title inside the UI shown to users.
- `ExtraJsonData__c`: Text field containing any extra specifications of this cart item in JSON format.

Look at the project's metadata for a better idea of the needed custom objects.


## Definition of a Campaign

All of the campaigns are defined within the `AdWebCart__c` records' `CampaignStartDate__c` and `CampaignEndDate__c` fields. A single campaign spans the given time period.

Only valid campaigns should be shown within the calendar.

- A campaign is not valid if the start or end date are missing.
- A campaign is not valid if the end date is earlier than the start date.

## Definition of a Campaign Product

All `AdWebCartItem__c` records are products that are assigned to an `AdWebCart__c` campaign record. The products will be advertised during the campaign.

## Window Layout Specifications

The campaign items should be shown as the last item inside the Edit View's information fields, above the save button.

The title for the list of the items should be "Kampanjan Tuotteet".

Each item inside the list of campaign items should be a lightning badge component to keep it compact.
The list is laid out horizontally but will wrap around if there is too little space for all the items to be shown.

## Extra Specifications

- Ask questions until you're 95% sure you can complete this task.
- Query the objects using CLI if they are not exposed in the project.
- NEVER create any new custom objects into the org, use the specified existing objects.
- NEVER use window.prompt for taking input from the user.