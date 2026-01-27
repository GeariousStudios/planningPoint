using backend.Dtos.MasterPlan;

namespace backend.Dtos.Product
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<MasterPlanDto> MasterPlans { get; set; } = new();
        public List<MasterPlanFieldDto> MasterPlanFields { get; set; } = new();
        public List<ProductFieldValueDto> ProductFieldValues { get; set; } = new();
        public bool IsHidden { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
