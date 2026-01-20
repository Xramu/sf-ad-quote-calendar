## Task Description

Create a day-based advertisement campaign calendar for showing reserved time periods of advertisement campaigns and their individual items.

The code should follow standard Salesforce styling and development best practices and be deployable to a scratch org or sandbox.

Keep it fun and readable.

## Object References

## Ad Space Specification

Object `AdSpaceSpecification` function:
- Contains the details of the advertiesement of a `AdWebCartItem__c` record.
- Only detail needed for the calendar are the StartDateTime and EndTimeDate fields for seeing the advertisement period.

`AdSpaceSpecification` fields:
- `StartDateTime`: 
- `EndDateTime`: 

### Ad Web Cart

Custom Object `AdWebCart__c` function:
- Works as the parent object to `AdWebCartItem__c` records.
- Has campaign start and end dates for tracking the total length of the advertising campaign.
- Contains the description of the whole advertising campaign.
- References the contact and account of the campaign.
- Keeps track of the cart's confirmation status.

`AdWebCart__c` fields:
- `Account__c`: Reference of the account record that created this cart.
- `Contact__c`: Reference to a contact record that is assigned to this cart.
- `CampaignStartDate__c`: Start date of the whole cart's advertising campaign.
- `CampaignEndDate__c`: End date of the whole cart's advertising campaign.
- `Description`: Rich text area containing detailed description of the cart and it's campaign.
- `Status__c`: Picklist field defining the confimation status of this cart. Uses the global value set `WebAdCartStatusOptions`.

### Ad Web Cart Item

Custom Object `AdWebCartItem__c` function:
- Works as a child object to `AdWebCart__c` record.
- Has a name field for quick identification of the item in the UI.
- Includes some extra configurations for the cart item in JSON format.
- References `AdSpaceSpecification` record for the advertisement details of the item.

`AdWebCartItem__c` fields:
- `Cart__c`: Reference to the `AdWebCart__c` record that this item is a child of.
- `ItemName__c`: Human readable name of this cart item.
- `ExtraJsonData__c`: Text field contaning any extra specifications of this cart item in JSON format.
- `Specification__c`: Reference to a `AdSpaceSpecification` record that has extra details about the advertisement of this item.

## Related Colors

## Window Layout Specifications

Create each window in a modular way, creating their own component for each window. When communicating between the components, use Salesforce standards and best practices. Share common functionality like Apex classes for fetching data and reuse code where ever possible and acceptable to keep it readable.

The whole component is supposed to be a full window sized component showing a lot of information at once to the user.

### Calendar View

The `Calendar View` is the main child component taking 80% of the width of the window from the left.

#### Year Based Viewing

The Calendar View shows the current year by default and lets the user go back and forth between years.

Whenever the selected year gets changed, the calendar will update its contents to show the reserved campaign time periods of the newly selected year.

The Calendar View has a grid of `Day Cell` components inside it. Every day of the currently selected year is shown inside the calendar view. There should not be empty space between the Day Cells, making the whole calendar one continious compact grid of days.

When showing the day cells, take in account leap years and make sure the day cells get updated when the year changes.

### Day Cell Component

A `Day Cell` is a separate component that shows a single day's number as a label and any campaign that are happening during it.

The Day Cell's label is the day of the month number that it falls on.

A Day Cell's color is determined by its month and possible campaigns during its date.

The Day Cell is colored green if any of the campaigns happening during it belong to the currently logged in account.

The campaign periods are the time periods between the campaign start and end of each `AdWebCart__c` record. The current account is compared to the account reference inside the same record.

If none of the campaigns that exist for the Day Cell's specific day belong to the current account, the Day Cell will be colored dark grey.

If there are no campaigns happening during the Day Cell's date, the Day Cell will be colored white.

The Day Cell will have a slightly darker color when it is part of every other month, making the months stand out inside the grid of days. For example all of February's and April's Day Cells will be slightly darker and January's and March's Day Cells.

The original color of the day cell based on the campaigns it has will stay, the tint will just be slightly darker for every other month starting from February.

The Day Cells get dynamically updated to match the currently selected year if it is changed.

Clicking a Day Cell that has campaigns happening during it will show the `AdWebCartItem__c` records that have their AdSpaceSpecification 

### Details View

The Details View is the secondary child component taking the last 20% of the screen width from the right.

## User Interface Requirements

## Extra Specifications

- Ask questions until you're 95% sure you can complete this task.
- Query the objects using CLI if they are not exposed in the project.
- NEVER create any new custom objects into the org, use the specified existing objects.
- NEVER use window.prompt for taking input from the user.
- DO NOT create any applications, tabs or sites, only lightning web component code and Apex.