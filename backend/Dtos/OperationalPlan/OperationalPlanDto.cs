namespace backend.Dtos.OperationalPlan
{
    public class OperationalPlanDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UnitGroupId { get; set; }
        public string UnitGroupName { get; set; } = string.Empty;
        public int? MasterPlanId { get; set; }
        public string MasterPlanName { get; set; } = string.Empty;
        public string ProductLightColorHex { get; set; } = "#ff9505";
        public string ProductDarkColorHex { get; set; } = "#e2711d";
        public string ProductLightTextColorHex { get; set; } = "#ffffff";
        public string ProductDarkTextColorHex { get; set; } = "#000000";
        public bool IsHidden { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        // Check-out system.
        public bool IsCheckedOut { get; set; } = false;
        public string? CheckedOutBy { get; set; }
        public DateTime? CheckedOutAt { get; set; }
    }
}
