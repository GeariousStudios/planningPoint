namespace backend.Models.ManyToMany
{
    public class PlannedStopToMasterPlan
    {
        public int PlannedStopId { get; set; }
        public PlannedStop PlannedStop { get; set; } = null!;

        public int MasterPlanId { get; set; }
        public MasterPlan MasterPlan { get; set; } = null!;

        public bool IsActive { get; set; }
        public int Order { get; set; }
    }
}
