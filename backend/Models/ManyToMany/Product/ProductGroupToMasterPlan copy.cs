namespace backend.Models.ManyToMany
{
    public class ProductGroupToMasterPlan
    {
        public int ProductGroupId { get; set; }
        public ProductGroup ProductGroup { get; set; } = null!;

        public int MasterPlanId { get; set; }
        public MasterPlan MasterPlan { get; set; } = null!;

        public bool IsActive { get; set; }
        public int Order { get; set; }
    }
}
