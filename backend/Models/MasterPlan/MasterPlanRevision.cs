using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class MasterPlanRevision
    {
        public int Id { get; set; }

        public int MasterPlanId { get; set; }
        public MasterPlan? MasterPlan { get; set; }

        public int RevisionNumber { get; set; }

        public DateTime ArchivedAt { get; set; }
        public string ArchivedBy { get; set; } = string.Empty;

        [MaxLength(64)]
        public string Name { get; set; } = string.Empty;

        public string SnapshotJson { get; set; } = string.Empty;
    }
}
