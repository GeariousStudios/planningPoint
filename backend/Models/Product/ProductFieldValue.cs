namespace backend.Models
{
    public class ProductFieldValue
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int MasterPlanFieldId { get; set; }
        public string Value { get; set; } = string.Empty;

        public Product Product { get; set; } = null!;
        public MasterPlanField MasterPlanField { get; set; } = null!;
    }
}
