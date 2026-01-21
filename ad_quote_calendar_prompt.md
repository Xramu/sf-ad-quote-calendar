## Task Description

Create a week-based advertisement campaign calendar for showing reserved time periods of advertisement campaigns.

The code should follow standard Salesforce styling and development best practices and be deployable to a scratch org or sandbox.

Keep it fun and readable.

## Object References

### Ad Space Specification

Object `AdSpaceSpecification` function:
- Contains the details of the advertiesement of a `AdWebCartItem__c` record.
- Only detail needed for the calendar are the StartDateTime and EndTimeDate fields for seeing the advertisement period.

`AdSpaceSpecification` fields:
- `StartDateTime`: Start time of the advertisement space period.
- `EndDateTime`: End time of the adverisement space period.

### Ad Web Cart

Custom Object `AdWebCart__c` function:
- Works as the parent object to `AdWebCartItem__c` records.
- Has campaign start and end dates for tracking the total length of the advertising campaign.
- Has the name of the campaign.
- Contains the description of the whole advertising campaign.
- References the contact and account of the campaign.
- Keeps track of the cart's confirmation status.

`AdWebCart__c` fields:
- `Account__c`: Reference of the account record that created this cart.
- `Contact__c`: Reference to a contact record that is assigned to this cart.
- `CampaignName__c`: Human readable name of the campaign used as its title inside the UI.
- `CampaignStartDate__c`: Start date of the whole cart's advertising campaign.
- `CampaignEndDate__c`: End date of the whole cart's advertising campaign.
- `Description__c`: Rich text area containing detailed description of the cart and it's campaign.
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
- `Specification__c`: Reference to a `AdSpaceSpecification` record that has extra details about the advertisement of this item. Includes the start and end date times for tracking when the advertiesement space is reserved for the item.

## Related Colors

## Definition of a Campaign

All of the campaigns are defined within the `AdWebCart__c` records' `CampaignStartDate` and `CampaignEndDate` fields. A single campaign spans through the given time period.

Only valid campaigns should be shown within the calendar.

- A campaign is not valid if the start or end date are missing.
- A campaign is not valid if the end date is earlier than the start date.

## Window Layout Specifications

Create each window in a modular way, creating their own component for each window. When communicating between the components, use Salesforce standards and best practices. Share common functionality like Apex classes for fetching data and reuse code where ever possible and acceptable to keep it readable.

The whole component is supposed to be a full window sized component showing a lot of information at once to the user.

### Calendar View

The `Calendar View` is the main child component taking 80% of the width of the window from the left.

#### Year Based Viewing

The Calendar View shows the current year by default and lets the user go back and forth between years.

Whenever the selected year gets changed, the calendar will update its contents to show the reserved campaign time periods of the newly selected year.

The Calendar View has a grid of `Week Cell`s inside it. Each Cell representing a week within the currently selected year.

The Week Cells are spaced tightly together and show their week numbers inside them. The color of the week cell depends on any campaigns happening during it.

### Week Cell Component

A `Week Cell` is a separate component that is used inside the Calendar View to show a singular week.

The Week Cell has a label and color. The label will have the week's number and the color changes based on campaigns happening during it.

#### Week Cell's Color Definition

Any Week Cell that has at least one of their days fall into at least one campaign's period will have a specific color indicating a campaign happening during that specific week.

**White**:<br>
If a no campaings are happening during any of the days of a single week, the Week Cell will be colored with the default white color.

**Green**:<br>
If any of the campaigns happening during any of the days of the specific week belongs to the current account, color the Week Cell with a light green color. Check for the matching account using the current account and the `AdWebCart__c` field `Account__c`.

**Grey**:<br>
If the week has any days that belong to any campaign's period but does not have any that belong to the current user, color the Week Cell light grey color.

#### Week Cell Clicking

When the user clicks a Week Cell that has at least one campaign happening during it, the Details View's List View will show a list of all the campaigns happening during it. The list will show each campaign's `AdWebCart__c` record's `CampaignName__c` as its name.

The user can then click one of the items inside the list to open the Details View's Edit View to show the `CampaignName__c` as editable text field and `Description__c` as editable rich text field.

If the Week Cell has only one campaign happening during it, show it in the List View like usual but also open it right away in the Edit View as well, since there is only one campaign to be selected during that week.

### Details View

The `Details View` is the secondary child component taking the last 20% of the screen width from the right.

On the top of the Details View, taking 30% of the height is the List View that will be used to show a list of campaigns from a selected Week Cell. List View will be empty if no Week Cell is selected.

Underneath the List View is the Edit View which takes the rest of the space to allow the user to edit the currently selected campaign's information. Edit View will be empty if no Week Cell or Campaign is selected.

#### List View

The `List View` is a scrollable list of clickable campaign buttons from the currently selected Week Cell's campaigns. Each campaign button has its label set as that campaign's name.

If the campaign's cart has the current account assigned to it, color the button light green, otherwise the button will be light grey. Match the colors with the ones used for the Week Cell coloring.

If a campaign button is pressed, open the campaign's details inside the Edit View.

If a campaign is selected, highlight the button of the selected campaign.

Do not use lignting button since it can not be colored with custom colors.

#### Edit View

The `Edit View` will show the currently selected campaign's information inside it.

For now all the information needed will be the name, description and time period.

The name should be a lightning input text area.

The description should be a lightning input rich text area.

The name and the description input fields should save the changes to the record once the user unfocuses from the field.

The time period is not editable but should be shown in the format of `DD.MM.YYYY - DD.MM.YYYY`.

The information is stacked vertically and labeled in the following order:
- Confirmation Status (Label: `Campaign Confirmation Status`)
- Name (Label: `Campaign Name`)
- Description (Label: `Campaign Description`)
- Time Period (Label: `Campaign Time Period`)

## User Interface Requirements

The Week Cells should update in real time whenever the currently selected year gets changed by the user.

## Extra Specifications

- Ask questions until you're 95% sure you can complete this task.
- Query the objects using CLI if they are not exposed in the project.
- NEVER create any new custom objects into the org, use the specified existing objects.
- NEVER use window.prompt for taking input from the user.
- DO NOT create any applications, tabs or sites, only lightning web component code and Apex.