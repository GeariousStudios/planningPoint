using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class MasterPlanField
    {
        public int Id { get; set; }

        [MaxLength(64)]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public MasterPlanFieldDataType DataType { get; set; }
        public MasterPlanFieldAlignment Alignment { get; set; }
        public List<MasterPlanFieldMapping> FieldMappings { get; set; } = new();
        public bool LocalIncremental { get; set; }
        public bool GlobalIncremental { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<MasterPlanToMasterPlanField> MasterPlanToMasterPlanFields { get; set; } = new();
        public List<ProductToMasterPlanField> ProductToMasterPlanFields { get; set; } = new();
    }

    public enum MasterPlanFieldDataType
    {
        Number,
        Decimal,
        Text,
        Boolean,
        Date,
    }

    public enum MasterPlanFieldAlignment
    {
        Left,
        Center,
        Right,
    }
}
