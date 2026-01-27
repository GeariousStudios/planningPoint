using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.SubCategory
{
    public class UpdateSubCategoryDto
    {
        // ID here only for identification, not for changing.
        public int Id { get; set; }

        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(64, ErrorMessage = "[2|Common/Name|64] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public int[]? CategoryIds { get; set; }
    }
}
