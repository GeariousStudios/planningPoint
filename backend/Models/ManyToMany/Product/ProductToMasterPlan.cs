namespace backend.Models.ManyToMany
{
    public class ProductToMasterPlan
    {
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public int MasterPlanId { get; set; }
        public MasterPlan MasterPlan { get; set; } = null!;

        public bool IsActive { get; set; }
        public int Order { get; set; }
    }
}
