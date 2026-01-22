using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class OperationalPlan
    {
        public int Id { get; set; }

        [MaxLength(64)]
        public string Name { get; set; } = string.Empty;
        public int UnitGroupId { get; set; }
        public required UnitGroup UnitGroup { get; set; }
        public int? MasterPlanId { get; set; }
        public MasterPlan? MasterPlan { get; set; }

        [MaxLength(7)]
        public string ProductLightColorHex { get; set; } = "#ff9505";

        [MaxLength(7)]
        public string ProductDarkColorHex { get; set; } = "#e2711d";
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
