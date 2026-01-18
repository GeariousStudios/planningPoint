namespace backend.Dtos.MasterPlan
{
    public class MasterPlanImportRulesDto
    {
        public Dictionary<int, string> Mappings { get; set; } = new();
        public int? GroupFieldId { get; set; }
        public bool ReplaceOnImport { get; set; }
        public bool SkipRowOne { get; set; }
    }
}
