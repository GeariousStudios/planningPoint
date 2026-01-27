using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.OperationalPlan
{
    public class CreateOperationalPlanDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(64, ErrorMessage = "[2|Common/Name|64] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|OperationalPlan/a group] Validation/Please select")]
        public int UnitGroupId { get; set; }
        public int? MasterPlanId { get; set; }

        [MaxLength(7, ErrorMessage = "[4|Common/a color|7] Validation/cannot exceed")]
        [RegularExpression(
            "^#([0-9A-Fa-f]{6})$",
            ErrorMessage = "[5|Common/Color format] Validation/is invalid"
        )]
        public string ProductLightColorHex { get; set; } = "#ff9505";

        [MaxLength(7, ErrorMessage = "[6|Common/a color|7] Validation/cannot exceed")]
        [RegularExpression(
            "^#([0-9A-Fa-f]{6})$",
            ErrorMessage = "[7|Common/Color format] Validation/is invalid"
        )]
        public string ProductDarkColorHex { get; set; } = "#e2711d";
        public bool IsHidden { get; set; }
    }
}
