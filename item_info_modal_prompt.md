## Task Description

Add a modal popup window for showing the extra information of a selected product inside the DetailsView of the AdQuoteCalendar Lightning Web Component.

Whenever the user clicks a badge of an item inside the DetailsView's Edit View section, a modal showing the extra information of that item should pop up on the screen.

The extra information JSON of an item can have many any amount of key value pairs inside it. Each one should be shown with the key being the title label and value being the paragraph text underneath it.

When showing the title add a `:` at the end of the title value.

## Extra Information Format

The extra information is located inside the extraJsonData of the loaded record through AdCampaignCalendarService Apex class.

The extra json data has an array of information inside it, each array element has two values inside it. They keys to the values are as follows:
- `name`: Name of the extra information section. Used as the title inside the modal.
- `value`: The extra information to be shown underneath the title.

If the item does not have any extra information JSON or the JSON is invalid, show the text `Tuotteella ei ole lisätietoja.` inside the modal.

## Window Layout Specifications

The modal should be made by using the lightning modal from salesforce.

The user does not need to edit any of the information, this is supposed to be just a quick extra information screen.

The modal window and its functionality should be a seperate child LWC that is not exposed. The modal window component gets the item data passed to it when the item is selected and the modal is popped up.

## Extra Specifications

- Ask questions until you're 95% sure you can complete this task.
- Query the objects using CLI if they are not exposed in the project.
- NEVER create any new custom objects into the org, use the specified existing objects.
- NEVER use window.prompt for taking input from the user.