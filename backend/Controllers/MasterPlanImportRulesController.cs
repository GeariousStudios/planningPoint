using System.Globalization;
using backend.Data;
using backend.Dtos.MasterPlan;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace backend.Controllers
{
    [ApiController]
    [Route("master-plan/import-rules")]
    public class MasterPlanImportRulesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public MasterPlanImportRulesController(
            AppDbContext context,
            UserService userService,
            ITranslationService t,
            AuditTrailService audit
        )
        {
            _context = context;
            _userService = userService;
            _t = t;
            _audit = audit;
        }

        private async Task<string> GetLangAsync()
        {
            var username = User.Identity?.Name;
            if (!string.IsNullOrEmpty(username))
            {
                var lang = await _context
                    .Users.Where(u => u.Username == username)
                    .Select(u => u.UserPreferences!.Language)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrWhiteSpace(lang))
                    return lang!;
            }

            var headerLang = Request.Headers["X-User-Language"].ToString();
            if (headerLang == "sv" || headerLang == "en")
                return headerLang;

            return "sv";
        }

        [HttpGet("{masterPlanId}")]
        public async Task<IActionResult> GetImportRules(int masterPlanId)
        {
            var lang = await GetLangAsync();

            var masterPlan = await _context
                .MasterPlans.Include(mp => mp.FieldMappings)
                .Include(mp => mp.MasterPlanToMasterPlanFields)
                .ThenInclude(x => x.MasterPlanField)
                .FirstOrDefaultAsync(mp => mp.Id == masterPlanId);

            if (masterPlan == null)
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });

            var mappings = await _context
                .MasterPlanFieldMappings.Where(m => m.MasterPlanId == masterPlanId)
                .Select(m => new { fieldId = m.FieldId, excelColumn = m.ExcelColumn })
                .ToListAsync();

            var groupFieldId = masterPlan
                .MasterPlanToMasterPlanFields.Where(x => x.IsGroupKey)
                .Select(x => (int?)x.MasterPlanFieldId)
                .FirstOrDefault();

            return Ok(
                new
                {
                    mappings,
                    groupFieldId,
                    replaceOnImport = masterPlan.ReplaceOnImport,
                }
            );
        }

        [HttpPost("{masterPlanId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SaveImportRules(
            int masterPlanId,
            MasterPlanImportRulesDto dto
        )
        {
            var lang = await GetLangAsync();

            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (username, userId) = userInfo.Value;

            var masterPlan = await _context
                .MasterPlans.Include(mp => mp.FieldMappings)
                .Include(mp => mp.MasterPlanToMasterPlanFields)
                .ThenInclude(x => x.MasterPlanField)
                .FirstOrDefaultAsync(mp => mp.Id == masterPlanId);

            if (masterPlan == null)
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });

            if (
                dto.GroupFieldId.HasValue
                && !masterPlan.MasterPlanToMasterPlanFields.Any(x =>
                    x.MasterPlanFieldId == dto.GroupFieldId.Value
                )
            )
            {
                return BadRequest(
                    new { message = await _t.GetAsync("MasterPlan/InvalidGroupField", lang) }
                );
            }

            var oldMap = masterPlan
                .FieldMappings.Where(m => !string.IsNullOrWhiteSpace(m.ExcelColumn))
                .Select(m =>
                {
                    var fieldName = _context
                        .MasterPlanFields.Where(f => f.Id == m.FieldId)
                        .Select(f => f.Name)
                        .First();
                    return $"{fieldName}: {m.ExcelColumn}";
                })
                .ToList();

            var oldGroupFieldId = masterPlan
                .MasterPlanToMasterPlanFields.Where(x => x.IsGroupKey)
                .Select(x => (int?)x.MasterPlanFieldId)
                .FirstOrDefault();

            var oldGroupFieldName = oldGroupFieldId.HasValue
                ? _context
                    .MasterPlanFields.Where(f => f.Id == oldGroupFieldId.Value)
                    .Select(f => f.Name)
                    .FirstOrDefault()
                : null;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = masterPlanId,
                ["BelongsToMasterPlan"] = masterPlan.Name + $" (ID: {masterPlanId})",
                ["ReplaceOnImport"] = masterPlan.ReplaceOnImport
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
                ["GroupKey"] = oldGroupFieldId.HasValue
                    ? $"{oldGroupFieldName} (ID: {oldGroupFieldId.Value})"
                    : "—",
                ["Mappings"] = oldMap.Count > 0 ? string.Join("<br>", oldMap) : "—",
            };

            masterPlan.ReplaceOnImport = dto.ReplaceOnImport;

            foreach (var link in masterPlan.MasterPlanToMasterPlanFields)
            {
                link.IsGroupKey =
                    dto.GroupFieldId.HasValue && link.MasterPlanFieldId == dto.GroupFieldId.Value;
            }

            _context.MasterPlanFieldMappings.RemoveRange(masterPlan.FieldMappings);

            foreach (var kv in dto.Mappings)
            {
                if (string.IsNullOrWhiteSpace(kv.Value))
                    continue;

                var field = await _context.MasterPlanFields.FirstAsync(f => f.Id == kv.Key);

                _context.MasterPlanFieldMappings.Add(
                    new MasterPlanFieldMapping
                    {
                        MasterPlanId = masterPlanId,
                        FieldId = kv.Key,
                        ExcelColumn = kv.Value,
                        MasterPlan = masterPlan,
                        Field = field,
                    }
                );
            }

            await _context.SaveChangesAsync();

            var newMap = dto
                .Mappings.Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                .Select(kv =>
                {
                    var fieldName = _context
                        .MasterPlanFields.Where(f => f.Id == kv.Key)
                        .Select(f => f.Name)
                        .First();
                    return $"{fieldName}: {kv.Value}";
                })
                .ToList();

            var newGroupFieldName = dto.GroupFieldId.HasValue
                ? _context
                    .MasterPlanFields.Where(f => f.Id == dto.GroupFieldId.Value)
                    .Select(f => f.Name)
                    .FirstOrDefault()
                : null;

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "MasterPlanImportRules",
                masterPlanId,
                username,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = masterPlanId,
                        ["BelongsToMasterPlan"] = masterPlan.Name + $" (ID: {masterPlanId})",
                        ["ReplaceOnImport"] = dto.ReplaceOnImport
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                        ["GroupKey"] = dto.GroupFieldId.HasValue
                            ? $"{newGroupFieldName} (ID: {dto.GroupFieldId.Value})"
                            : "—",
                        ["Mappings"] = newMap.Count > 0 ? string.Join("<br>", newMap) : "—",
                    },
                }
            );

            return Ok();
        }

        [HttpPost("import")]
        [Authorize(Roles = "Master Planner, Admin")]
        public async Task<IActionResult> ImportExcel(
            [FromForm] IFormFile file,
            [FromForm] int masterPlanId
        )
        {
            if (file == null)
                return BadRequest();

            var masterPlan = await _context
                .MasterPlans.Include(mp => mp.MasterPlanToMasterPlanFields)
                .FirstOrDefaultAsync(mp => mp.Id == masterPlanId);

            if (masterPlan == null)
                return BadRequest();

            var groupFieldId = masterPlan
                .MasterPlanToMasterPlanFields.Where(x => x.IsGroupKey)
                .Select(x => (int?)x.MasterPlanFieldId)
                .FirstOrDefault();

            var mappings = await _context
                .MasterPlanFieldMappings.Where(x => x.MasterPlanId == masterPlanId)
                .ToListAsync();

            if (mappings.Count == 0)
                return Ok(new List<object>());

            MasterPlanFieldMapping? groupMapping = null;

            if (groupFieldId.HasValue)
            {
                groupMapping = mappings.FirstOrDefault(m => m.FieldId == groupFieldId.Value);
            }

            var fieldIds = mappings.Select(m => m.FieldId).Distinct().ToList();

            var fieldDataTypes = await _context
                .MasterPlanFields.Where(f => fieldIds.Contains(f.Id))
                .Select(f => new { f.Id, f.DataType })
                .ToDictionaryAsync(x => x.Id, x => x.DataType);

            using var stream = file.OpenReadStream();
            using var package = new ExcelPackage(stream);
            var sheet = package.Workbook.Worksheets.First();
            int lastRow = sheet.Dimension.End.Row;

            var rows = new List<Dictionary<int, string>>();

            for (int row = 1; row <= lastRow; row++)
            {
                var rowValues = new Dictionary<int, string>();
                bool hasAnyValue = false;

                foreach (var map in mappings)
                {
                    if (!fieldDataTypes.TryGetValue(map.FieldId, out var dataType))
                    {
                        rowValues[map.FieldId] = "";
                        continue;
                    }

                    int colIndex = GetColumnIndex(map.ExcelColumn);
                    var cell = sheet.Cells[row, colIndex];

                    var validated = ValidateCell(cell, dataType);
                    rowValues[map.FieldId] = validated;

                    if (!string.IsNullOrWhiteSpace(validated))
                        hasAnyValue = true;
                }

                if (hasAnyValue)
                    rows.Add(rowValues);
            }

            if (rows.Count == 0)
                return Ok(new List<object>());

            if (groupMapping == null)
            {
                var plain = rows.Select(v => new { values = v }).ToList();
                return Ok(plain);
            }

            var grouped = new List<Dictionary<int, string>>();
            var groupIndexByKey = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var rowValues in rows)
            {
                rowValues.TryGetValue(groupMapping.FieldId, out var keyRaw);
                var key = (keyRaw ?? "").Trim();

                if (string.IsNullOrWhiteSpace(key))
                {
                    grouped.Add(rowValues);
                    continue;
                }

                if (!groupIndexByKey.TryGetValue(key, out var firstIndex))
                {
                    groupIndexByKey[key] = grouped.Count;
                    grouped.Add(rowValues);
                    continue;
                }

                var insertIndex = firstIndex + 1;

                while (insertIndex < grouped.Count)
                {
                    grouped[insertIndex].TryGetValue(groupMapping.FieldId, out var existingKeyRaw);
                    var existingKey = (existingKeyRaw ?? "").Trim();

                    if (!string.Equals(existingKey, key, StringComparison.OrdinalIgnoreCase))
                        break;

                    insertIndex++;
                }

                grouped.Insert(insertIndex, rowValues);

                var keysToAdjust = groupIndexByKey.Keys.ToList();
                foreach (var k in keysToAdjust)
                {
                    if (
                        groupIndexByKey[k] >= insertIndex
                        && !string.Equals(k, key, StringComparison.OrdinalIgnoreCase)
                    )
                        groupIndexByKey[k] = groupIndexByKey[k] + 1;
                }
            }

            var result = grouped.Select(v => new { values = v }).ToList();
            return Ok(result);
        }

        private string ValidateCell(ExcelRange cell, MasterPlanFieldDataType dataType)
        {
            var text = (cell.Text ?? "").Trim();
            if (string.IsNullOrWhiteSpace(text))
                return "";

            if (dataType == MasterPlanFieldDataType.Text)
                return text;

            if (dataType == MasterPlanFieldDataType.Number)
            {
                if (double.TryParse(text, NumberStyles.Any, CultureInfo.InvariantCulture, out _))
                    return text;

                if (double.TryParse(text, NumberStyles.Any, CultureInfo.CurrentCulture, out _))
                    return text;

                return "";
            }

            if (dataType == MasterPlanFieldDataType.Boolean)
            {
                var norm = text.Trim().ToLowerInvariant();

                if (
                    norm == "true"
                    || norm == "1"
                    || norm == "yes"
                    || norm == "y"
                    || norm == "ja"
                    || norm == "j"
                )
                    return "true";

                if (norm == "false" || norm == "0" || norm == "no" || norm == "n" || norm == "nej")
                    return "false";

                if (bool.TryParse(text, out var b))
                    return b ? "true" : "false";

                return "";
            }

            if (dataType == MasterPlanFieldDataType.Date)
            {
                if (cell.Value is DateTime dt)
                    return dt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

                if (cell.Value is double oa)
                {
                    try
                    {
                        var d = DateTime.FromOADate(oa);
                        return d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                    }
                    catch
                    {
                        return "";
                    }
                }

                if (
                    DateTime.TryParse(
                        text,
                        CultureInfo.CurrentCulture,
                        DateTimeStyles.None,
                        out var parsedLocal
                    )
                )
                    return parsedLocal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

                if (
                    DateTime.TryParse(
                        text,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None,
                        out var parsedInv
                    )
                )
                    return parsedInv.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

                return "";
            }

            return "";
        }

        private int GetColumnIndex(string columnName)
        {
            int index = 0;
            foreach (char c in columnName.ToUpper())
                index = index * 26 + (c - 'A' + 1);
            return index;
        }
    }
}
