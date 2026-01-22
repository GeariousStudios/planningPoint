using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Product
{
    public class UpdateProductDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(64, ErrorMessage = "[2|Common/Name|64] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public int[]? MasterPlanIds { get; set; }
        public int[]? MasterPlanFieldIds { get; set; }
        public List<ProductFieldValueDto>? ProductFieldValues { get; set; }
        public bool IsHidden { get; set; }
    }
}
