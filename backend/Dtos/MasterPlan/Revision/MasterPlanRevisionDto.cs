namespace backend.Dtos.MasterPlan
{
    public class MasterPlanRevisionDto
    {
        public int Id { get; set; }
        public int RevisionNumber { get; set; }
        public string Label { get; set; } = string.Empty;
        public DateTime ArchivedAt { get; set; }
        public string ArchivedBy { get; set; } = string.Empty;
    }
}
