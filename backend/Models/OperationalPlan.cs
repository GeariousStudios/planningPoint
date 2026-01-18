using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class OperationalPlan
    {
        public int Id { get; set; }

        [MaxLength(32)]
        public string Name { get; set; } = string.Empty;
        public int? MasterPlanId { get; set; }
        public MasterPlan? MasterPlan { get; set; }
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
