using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.NewsType
{
    public class CreateNewsTypeDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(64, ErrorMessage = "[2|Common/Name|64] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
    }
}
