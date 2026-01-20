namespace backend.Models.ManyToMany
{
    public class ProductToMasterPlanField
    {
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public int MasterPlanFieldId { get; set; }
        public MasterPlanField MasterPlanField { get; set; } = null!;

        public bool IsActive { get; set; }
        public int Order { get; set; }
    }
}
