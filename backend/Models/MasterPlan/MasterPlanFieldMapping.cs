using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class MasterPlanFieldMapping
    {
        public int Id { get; set; }

        public int MasterPlanId { get; set; }
        public required MasterPlan MasterPlan { get; set; }

        public int FieldId { get; set; }
        public required MasterPlanField Field { get; set; }

        [MaxLength(8)]
        public required string ExcelColumn { get; set; }
    }
}
