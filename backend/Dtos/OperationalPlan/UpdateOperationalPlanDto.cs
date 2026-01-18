using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.OperationalPlan
{
    public class UpdateOperationalPlanDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name|32] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|OperationalPlan/a group] Validation/Please select")]
        public int UnitGroupId { get; set; }
        public int? MasterPlanId { get; set; }
        public bool IsHidden { get; set; }
    }
}
