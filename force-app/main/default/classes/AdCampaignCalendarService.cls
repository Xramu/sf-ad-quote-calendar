/**
 * @description Service for aggregating AdWebCart__c campaigns into weekly summaries and listing week campaigns.
 * Enforces sharing and FLS via WITH SECURITY_ENFORCED. Operates in USER_MODE for DML (none currently).
 * Weeks are Sunday-start per requirements. Week numbers are computed accordingly (non-ISO).
 *
 * UI usage:
 *  - getWeeklySummary(year): summary coloring flags per week (1..53)
 *  - getWeekCampaigns(year, weekNumber): list of minimal campaign DTOs for details list/edit
 *
 * Notes:
 *  - Valid campaign: CampaignStartDate__c and CampaignEndDate__c present AND EndDate >= StartDate
 *  - Only campaigns overlapping the selected year are considered
 *  - Current-user-owned: AdWebCart__c.User__c == running user id
 */
public with sharing class AdCampaignCalendarService {
    public class WeekSummaryDTO {
        @AuraEnabled public Integer weekNumber;
        @AuraEnabled public Boolean hasAnyCampaign;
        @AuraEnabled public Boolean hasCurrentUserCampaign;
        @AuraEnabled public Boolean hasOtherCampaign; // true if there exists at least one non-current-user campaign in the week
    }
    public class CampaignDTO {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String description;
        @AuraEnabled public Id ownerUserId;
        @AuraEnabled public Boolean hasCurrentUserCampaign;
        @AuraEnabled public Date startDate;
        @AuraEnabled public Date endDate;
        @AuraEnabled public String status; // optional for display if needed
    }

    public class ItemDTO {
        @AuraEnabled public Id id;
        @AuraEnabled public Id cartId;
        @AuraEnabled public String itemName;
        @AuraEnabled public String extraJsonData;
        @AuraEnabled public String ean;
        @AuraEnabled public AdSpaceSpecificationDTO adSpaceSpecification;

        public ItemDTO(AdWebCartItem__c record) {
            this.id = record.Id;
            this.cartId = record.Cart__c;
            this.itemName = record.ItemName__c;
            this.extraJsonData = record.ExtraJsonData__c;
            this.ean = record.EAN__c;

            if (record.Specification__r != null) {
                this.adSpaceSpecification = new AdSpaceSpecificationDTO(record.Specification__r);
            }
        }
    }

    public class AdSpaceSpecificationDTO {
        @AuraEnabled public Id id;
        @AuraEnabled public Boolean isActive;
        @AuraEnabled public Decimal audienceSizeRating;
        @AuraEnabled public String name;
        @AuraEnabled public String type;
        @AuraEnabled public String adSpaceType;
        @AuraEnabled public String position;
        @AuraEnabled public String programRunType;
        @AuraEnabled public String creativeFormatType;
        @AuraEnabled public Datetime startDateTime;
        @AuraEnabled public Datetime endDateTime;
        @AuraEnabled public String startWeekDay;
        @AuraEnabled public String endWeekDay;
        @AuraEnabled public List<String> section;
        @AuraEnabled public List<String> subSection;
        @AuraEnabled public List<String> broadcastDays;
        @AuraEnabled public Product2DTO adSpaceProduct;
        @AuraEnabled public MediaChannelDTO mediaChannel;

        public AdSpaceSpecificationDTO(AdSpaceSpecification record) {
            this.id = record.Id;
            this.isActive = record.IsActive;
            this.audienceSizeRating = record.AudienceSizeRating;
            this.name = record.Name;
            this.type = record.Type;
            this.adSpaceType = record.AdSpaceType;
            this.position = record.Position;
            this.programRunType = record.ProgramRunType;
            this.creativeFormatType = record.CreativeFormatType;
            this.startDateTime = record.StartDateTime;
            this.endDateTime = record.EndDateTime;
            this.startWeekDay = record.StartWeekDay;
            this.endWeekDay = record.EndWeekDay;
            this.section = AdCampaignCalendarService.SplitMultiSelectToList(record.Section);
            this.subSection = AdCampaignCalendarService.SplitMultiSelectToList(record.SubSection);
            this.broadcastDays = AdCampaignCalendarService.SplitMultiSelectToList(record.BroadcastDays);

            if (record.Product2 != null) {
                this.adSpaceProduct = new Product2DTO(record.Product2);
            }

            if (record.MediaChannel != null) {
                this.mediaChannel = new MediaChannelDTO(record.MediaChannel);
            }
        }
    }

    public class Product2DTO {
        @AuraEnabled public String name;
        @AuraEnabled public String productCode;
        @AuraEnabled public String description;

        public Product2DTO(Product2 record) {
            this.name = record.Name;
            this.productCode = record.ProductCode;
            this.description = record.Description;
        }
    }

    public class MediaChannelDTO {
        @AuraEnabled public String name;
        @AuraEnabled public String mediaType;
        @AuraEnabled public String pricingCategory;

        public MediaChannelDTO(MediaChannel record) {
            this.name = record.Name;
            this.mediaType = record.MediaType;
            this.pricingCategory = record.PricingCategory;
        }
    }

    public static List<String> SplitMultiSelectToList(String multiSelectString) {
        return multiSelectString != null ? multiSelectString.split(';') : new List<String>();
    }

    /**
     * @description Fetch AdWebCartItem__c records for the provided AdWebCart__c (campaign) Ids.
     * Returns flat DTOs including ExtraJsonData__c for future use.
     */
    @AuraEnabled(cacheable=true)
    public static List<ItemDTO> getCartItemsByCartIds(List<Id> cartIds) {
        if (cartIds == null || cartIds.isEmpty()) {
            return new List<ItemDTO>();
        }
        // Ensure only AdWebCart__c Ids are used (defensive)
        Set<Id> uniqueIds = new Set<Id>();
        for (Id i : cartIds) {
            if (i != null) uniqueIds.add(i);
        }
        if (uniqueIds.isEmpty()) {
            return new List<ItemDTO>();
        }

        String eanItemType = 'EAN';

        // Query
        List<AdWebCartItem__c> items = [
            SELECT
                Id,
                Cart__c,
                ItemName__c,
                ExtraJsonData__c,
                EAN__c,
                ItemType__c,

                Specification__r.IsActive,
                Specification__r.AudienceSizeRating,
                Specification__r.Name,
                Specification__r.Type,
                Specification__r.AdSpaceType,
                Specification__r.Position,
                Specification__r.ProgramRunType,
                Specification__r.CreativeFormatType,
                Specification__r.StartDateTime,
                Specification__r.EndDateTime,
                Specification__r.StartWeekDay,
                Specification__r.EndWeekDay,
                Specification__r.Section,
                Specification__r.SubSection,
                Specification__r.BroadcastDays,

                Specification__r.Product2.Name,
                Specification__r.Product2.ProductCode,
                Specification__r.Product2.Description,

                Specification__r.MediaChannel.Name,
                Specification__r.MediaChannel.MediaType,
                Specification__r.MediaChannel.PricingCategory
            FROM AdWebCartItem__c
            WHERE Cart__c IN :uniqueIds
            AND ItemType__c = :eanItemType
            WITH SECURITY_ENFORCED
        ];

        // Set up DTOs
        List<ItemDTO> out = new List<ItemDTO>();
        for (AdWebCartItem__c it : items) {
            // Field assignments handled in constructors
            out.add(new ItemDTO(it));
        }

        return out;
    }

    @AuraEnabled(cacheable=true)
    public static Map<Integer, WeekSummaryDTO> getWeeklySummary(Integer year) {
        if (year == null) {
            throw new AuraHandledException('Year is required');
        }
        Date yearStart = Date.newInstance(year, 1, 1);
        Date yearEnd   = Date.newInstance(year, 12, 31);

        List<AdWebCart__c> carts = [
            SELECT Id, CampaignName__c, CampaignStartDate__c, CampaignEndDate__c, User__c, Status__c
            FROM AdWebCart__c
            WHERE CampaignStartDate__c != NULL
              AND CampaignEndDate__c != NULL
              AND CampaignStartDate__c <= :yearEnd
              AND CampaignEndDate__c >= :yearStart
            WITH SECURITY_ENFORCED
        ];

        Map<Integer, WeekSummaryDTO> result = new Map<Integer, WeekSummaryDTO>();
        // Pre-seed 1..53
        for (Integer i = 1; i <= 53; i++) {
            WeekSummaryDTO dto = new WeekSummaryDTO();
            dto.weekNumber = i;
            dto.hasAnyCampaign = false;
            dto.hasCurrentUserCampaign = false;
            dto.hasOtherCampaign = false;
            result.put(i, dto);
        }

        Id runningUserId = UserInfo.getUserId();
        // Build a per-day coverage for relevant dates to map to weeks
        // To minimize per-day iteration, compute week index ranges for each campaign.
        for (AdWebCart__c cart : carts) {
            Date startDate = cart.CampaignStartDate__c;
            Date endDate   = cart.CampaignEndDate__c;

            // Clamp to current year window
            if (startDate < yearStart) startDate = yearStart;
            if (endDate > yearEnd) endDate = yearEnd;

            if (startDate > endDate) {
                continue;
            }

            Integer startWeek = getSundayStartWeekNumber(startDate, year);
            Integer endWeek   = getSundayStartWeekNumber(endDate, year);

            // Protect bounds to 1..53
            startWeek = Math.max(1, Math.min(53, startWeek));
            endWeek   = Math.max(1, Math.min(53, endWeek));

            Boolean isCurrentUserOwned = (cart.User__c == runningUserId);

            for (Integer w = startWeek; w <= endWeek; w++) {
                WeekSummaryDTO dto = result.get(w);
                if (dto == null) {
                    dto = new WeekSummaryDTO();
                    dto.weekNumber = w;
                    dto.hasAnyCampaign = false;
                    dto.hasCurrentUserCampaign = false;
                    dto.hasOtherCampaign = false;
                    result.put(w, dto);
                }
                dto.hasAnyCampaign = true;
                if (isCurrentUserOwned) {
                    dto.hasCurrentUserCampaign = true;
                } else {
                    dto.hasOtherCampaign = true;
                }
            }
        }

        // Remove trailing weeks that have no days in the year (some years will not need week 53 at all)
        // We will keep all 1..53 to simplify client rendering; client can hide weeks where both flags are false and computed week has no dates.
        return result;
    }

    @AuraEnabled(cacheable=false)
    public static List<CampaignDTO> getWeekCampaigns(Integer year, Integer weekNumber) {
        if (year == null || weekNumber == null) {
            throw new AuraHandledException('Year and weekNumber are required');
        }
        // Compute the date range (Sunday..Saturday) for the given week in that year
        Date weekStart = getSundayOfWeek(year, weekNumber);
        if (weekStart == null) {
            return new List<CampaignDTO>();
        }
        Date weekEnd = weekStart.addDays(6);

        List<AdWebCart__c> carts = [
            SELECT Id, CampaignName__c, Description__c, CampaignStartDate__c, CampaignEndDate__c, User__c, Status__c
            FROM AdWebCart__c
            WHERE CampaignStartDate__c != NULL
              AND CampaignEndDate__c != NULL
              AND CampaignStartDate__c <= :weekEnd
              AND CampaignEndDate__c >= :weekStart
            WITH SECURITY_ENFORCED
        ];

        List<CampaignDTO> out = new List<CampaignDTO>();
        for (AdWebCart__c c : carts) {
            CampaignDTO dto = new CampaignDTO();
            dto.id = c.Id;
            dto.name = c.CampaignName__c;
            dto.description = c.Description__c;
            dto.ownerUserId = c.User__c;
            dto.startDate = c.CampaignStartDate__c;
            dto.endDate = c.CampaignEndDate__c;
            dto.hasCurrentUserCampaign = c.User__c == UserInfo.getUserId();
            dto.status = c.Status__c;
            out.add(dto);
        }
        return out;
    }

    /**
     * @description Update an AdSpaceSpecification record with provided field values.
     * @param recordId Id of AdSpaceSpecification to update (required)
     * @param fieldName Field API name to update (e.g., 'AudienceSizeRating', 'StartDateTime', 'EndDateTime')
     * @param fieldValue New value for the field (as String, will be converted appropriately)
     * @return AdSpaceSpecificationDTO with updated info
     */
    @AuraEnabled
    public static AdSpaceSpecificationDTO updateAdSpaceSpecification(Id recordId, String fieldName, String fieldValue) {
        if (recordId == null || String.isBlank(fieldName)) {
            throw new AuraHandledException('recordId and fieldName are required');
        }

        // Pre-query WITH SECURITY_ENFORCED to respect FLS and sharing
        AdSpaceSpecification existing = [
            SELECT Id, IsActive, AudienceSizeRating, Name, Type, AdSpaceType, Position,
                   ProgramRunType, CreativeFormatType, StartDateTime, EndDateTime,
                   StartWeekDay, EndWeekDay, Section, SubSection, BroadcastDays,
                   Product2.Name, Product2.ProductCode, Product2.Description,
                   MediaChannel.Name, MediaChannel.MediaType, MediaChannel.PricingCategory
            FROM AdSpaceSpecification
            WHERE Id = :recordId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];

        if (existing == null) {
            throw new AuraHandledException('No record found for recordId ' + recordId);
        }

        // Prepare update
        AdSpaceSpecification upd = new AdSpaceSpecification(Id = existing.Id);

        // Set the field based on field name
        if (fieldName == 'AudienceSizeRating') {
            upd.AudienceSizeRating = String.isNotBlank(fieldValue) ? Decimal.valueOf(fieldValue) : null;
        } else if (fieldName == 'StartDateTime') {
            upd.StartDateTime = String.isNotBlank(fieldValue) ? parseIsoDatetime(fieldValue) : null;
        } else if (fieldName == 'EndDateTime') {
            upd.EndDateTime = String.isNotBlank(fieldValue) ? parseIsoDatetime(fieldValue) : null;
        } else {
            throw new AuraHandledException('Unsupported field: ' + fieldName);
        }

        // User mode DML
        Database.SaveResult sr = Database.update(upd, false, AccessLevel.USER_MODE);
        if (!sr.isSuccess()) {
            Database.Error err = sr.getErrors().isEmpty() ? null : sr.getErrors()[0];
            String msg = (err != null && String.isNotBlank(err.getMessage())) ? err.getMessage() : 'Unknown error during save';
            throw new AuraHandledException(msg);
        }

        // Re-query the latest values
        AdSpaceSpecification refreshed = [
            SELECT Id, IsActive, AudienceSizeRating, Name, Type, AdSpaceType, Position,
                   ProgramRunType, CreativeFormatType, StartDateTime, EndDateTime,
                   StartWeekDay, EndWeekDay, Section, SubSection, BroadcastDays,
                   Product2.Name, Product2.ProductCode, Product2.Description,
                   MediaChannel.Name, MediaChannel.MediaType, MediaChannel.PricingCategory
            FROM AdSpaceSpecification
            WHERE Id = :recordId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];

        return new AdSpaceSpecificationDTO(refreshed);
    }

    /**
     * @description Save updates to an AdWebCart__c record. Updates allowed fields only.
     * @param recordId Id of AdWebCart__c to update (required)
     * @param campaignName Optional new value for CampaignName__c
     * @param description Optional new value for Description__c
     * @return CampaignDTO with updated basic info
     */
    @AuraEnabled
    public static CampaignDTO saveCampaign(Id recordId, String campaignName, String description) {
        if (recordId == null) {
            throw new AuraHandledException('recordId is required');
        }

        // Pre-query WITH SECURITY_ENFORCED to respect FLS and sharing
        AdWebCart__c existing = [
            SELECT Id, CampaignName__c, Description__c, CampaignStartDate__c, CampaignEndDate__c, User__c, Status__c
            FROM AdWebCart__c
            WHERE Id = :recordId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];

        // Make sure a record exists before inserting
        if (existing == null) {
            throw new AuraHandledException('No record found for recordId ' + recordId);
        }

        // Prepare update with only provided fields
        AdWebCart__c upd = new AdWebCart__c(Id = existing.Id);
        Boolean hasChange = false;
        if (campaignName != null && campaignName != existing.CampaignName__c) {
            upd.CampaignName__c = campaignName;
            hasChange = true;
        }
        if (description != null && description != existing.Description__c) {
            upd.Description__c = description;
            hasChange = true;
        }

        if (hasChange) {
            // User mode DML and partial success handling
            Database.SaveResult sr = Database.update(upd, false, AccessLevel.USER_MODE);
            if (!sr.isSuccess()) {
                Database.Error err = sr.getErrors().isEmpty() ? null : sr.getErrors()[0];
                String msg = (err != null && String.isNotBlank(err.getMessage())) ? err.getMessage() : 'Unknown error during save';
                throw new AuraHandledException(msg);
            }
        }

        // Re-query the latest values (or use existing if no change)
        AdWebCart__c refreshed = [
            SELECT Id, CampaignName__c, Description__c, CampaignStartDate__c, CampaignEndDate__c, User__c, Status__c
            FROM AdWebCart__c
            WHERE Id = :recordId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];

        CampaignDTO dto = new CampaignDTO();
        dto.id = refreshed.Id;
        dto.name = refreshed.CampaignName__c;
        dto.description = refreshed.Description__c;
        dto.ownerUserId = refreshed.User__c;
        dto.startDate = refreshed.CampaignStartDate__c;
        dto.endDate = refreshed.CampaignEndDate__c;
        dto.hasCurrentUserCampaign = refreshed.User__c == UserInfo.getUserId();
        dto.status = refreshed.Status__c;
        return dto;
    }

    // Helper: compute Sunday-start week number within the given year
    // Week 1 starts on the first Sunday on or before Jan 1, but constrained to the year’s first week containing Jan 1.
    private static Integer getSundayStartWeekNumber(Date d, Integer year) {
        Date yearStart = Date.newInstance(year, 1, 1);
        Date firstSunday = getPreviousOrSameSunday(yearStart);
        // If firstSunday is in prior year, still fine as week 1 range begins there
        Integer daysDiff = firstSunday.daysBetween(d);
        Integer weekIndex = (Integer)Math.floor((Decimal.valueOf(daysDiff)) / 7) + 1;
        return Math.max(1, weekIndex);
    }

    // Get the Sunday for the given year/weekNumber
    private static Date getSundayOfWeek(Integer year, Integer weekNumber) {
        if (weekNumber < 1 || weekNumber > 53) {
            return null;
        }
        Date yearStart = Date.newInstance(year, 1, 1);
        Date firstSunday = getPreviousOrSameSunday(yearStart);
        Date sunday = firstSunday.addDays((weekNumber - 1) * 7);
        // If computed sunday goes beyond Dec 31, it might belong to next year; still return as the week bucket start.
        return sunday;
    }

    private static Date getPreviousOrSameSunday(Date d) {
        Date myDate = Date.today();
        Date referenceDate = Date.newInstance(1900, 1, 7); // This was a Sunday

        Integer daysBetween = referenceDate.daysBetween(myDate);
        Integer dayOfWeekNum = Math.mod(Math.abs(daysBetween), 7);

        Integer back = dayOfWeekNum; // 0 if Sunday, 1 if Monday, ..., 6 if Saturday
        return d.addDays(-back);
    }

    /**
     * @description Parse ISO 8601 datetime string (e.g., "2026-03-22T10:45:00.000Z") to Apex Datetime
     * Handles both formats with and without milliseconds and timezone
     */
    private static Datetime parseIsoDatetime(String isoString) {
        if (String.isBlank(isoString)) {
            return null;
        }

        // Remove milliseconds if present (.000)
        String cleaned = isoString.replaceAll('\\.\\d{3}', '');

        // Remove timezone indicator if present (Z or +00:00)
        cleaned = cleaned.replace('Z', '');
        cleaned = cleaned.replaceAll('[+-]\\d{2}:\\d{2}$', '');

        // Replace T with space for Apex Datetime.valueOf format
        cleaned = cleaned.replace('T', ' ');

        try {
            // Now it should be in format: YYYY-MM-DD HH:MM:SS
            return Datetime.valueOf(cleaned);
        } catch (Exception e) {
            throw new AuraHandledException('Invalid datetime format: ' + isoString);
        }
    }
}
