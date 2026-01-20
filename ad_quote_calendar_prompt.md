## Task Description

Create .

The code should follow standard Salesforce styling and development best practices and be deployable to a scratch org or sandbox.

Keep it fun and readable.

## Custom Object References

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

## User Interface Requirements

## Extra Specifications

- Ask questions until you're 95% sure you can complete this task.
- Query the objects using CLI if they are not exposed in the project.
- NEVER create any new custom objects into the org, use the specified existing objects.
- NEVER use window.prompt for taking input from the user.