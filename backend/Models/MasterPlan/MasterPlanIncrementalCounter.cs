using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class MasterPlanIncrementalCounter
    {
        public int Id { get; set; }
        public int MasterPlanFieldId { get; set; }
        public int? MasterPlanId { get; set; }
        public int LastNumber { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
