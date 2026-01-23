namespace backend.Models
{
    public class ProductGroupFieldValue
    {
        public int Id { get; set; }
        public int ProductGroupId { get; set; }
        public int ProductId { get; set; }
        public int MasterPlanFieldId { get; set; }
        public string Value { get; set; } = string.Empty;

        public ProductGroup ProductGroup { get; set; } = null!;
        public Product Product { get; set; } = null!;
        public MasterPlanField MasterPlanField { get; set; } = null!;
    }
}
