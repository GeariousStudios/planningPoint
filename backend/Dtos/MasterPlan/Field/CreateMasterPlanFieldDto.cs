using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.MasterPlan
{
    public class CreateMasterPlanFieldDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(64, ErrorMessage = "[2|Common/Name|64] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|MasterPlanField/a data type] Validation/Please select")]
        public MasterPlanFieldDataType DataType { get; set; }
        public MasterPlanFieldAlignment Alignment { get; set; } = MasterPlanFieldAlignment.Left;
        public bool LocalIncremental { get; set; }
        public bool GlobalIncremental { get; set; }
        public bool IsHidden { get; set; }
        // public int[]? MasterPlanIds { get; set; }
    }
}
