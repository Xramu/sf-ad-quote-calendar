### Ad Space Specification

Object `AdSpaceSpecification` function:
- Contains the details of the advertiesement of a `AdWebCartItem__c` record.
- Only detail needed for the calendar are the StartDateTime and EndTimeDate fields for seeing the advertisement period.

`AdSpaceSpecification` fields:
- `StartDateTime`: Start time of the advertisement space period.
- `EndDateTime`: End time of the adverisement space period.

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