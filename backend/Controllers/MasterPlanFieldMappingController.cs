using backend.Data;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace backend.Controllers
{
    [ApiController]
    [Route("master-plan/mapping")]
    public class MasterPlanFieldMappingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public MasterPlanFieldMappingController(
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
        public async Task<IActionResult> GetMappings(int masterPlanId)
        {
            var lang = await GetLangAsync();

            var exists = await _context.MasterPlans.AnyAsync(m => m.Id == masterPlanId);
            if (!exists)
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });

            var mappings = await _context
                .MasterPlanFieldMappings.Where(m => m.MasterPlanId == masterPlanId)
                .Select(m => new { fieldId = m.FieldId, excelColumn = m.ExcelColumn })
                .ToListAsync();

            return Ok(mappings);
        }

        [HttpPost("{masterPlanId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SaveMappings(int masterPlanId, Dictionary<int, string> dto)
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
                .FirstOrDefaultAsync(mp => mp.Id == masterPlanId);

            if (masterPlan == null)
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });

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

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = masterPlanId,
                ["BelongsToMasterPlan"] = masterPlan.Name + $" (ID: {masterPlanId})",
                ["Mappings"] = oldMap.Count > 0 ? string.Join("<br>", oldMap) : "—",
            };

            _context.MasterPlanFieldMappings.RemoveRange(masterPlan.FieldMappings);

            foreach (var kv in dto)
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

            var newMap = dto.Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                .Select(kv =>
                {
                    var fieldName = _context
                        .MasterPlanFields.Where(f => f.Id == kv.Key)
                        .Select(f => f.Name)
                        .First();
                    return $"{fieldName}: {kv.Value}";
                })
                .ToList();

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "MasterPlanFieldMapping",
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
                        ["Mappings"] = newMap.Count > 0 ? string.Join("<br>", newMap) : "—",
                    },
                }
            );

            return Ok();
        }

        [HttpDelete("{masterPlanId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ClearMappings(int masterPlanId)
        {
            var lang = await GetLangAsync();

            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (username, userId) = userInfo.Value;

            var existing = await _context
                .MasterPlanFieldMappings.Where(m => m.MasterPlanId == masterPlanId)
                .ToListAsync();

            var oldMapNamed = existing
                .Select(m =>
                {
                    var fieldName = _context
                        .MasterPlanFields.Where(f => f.Id == m.FieldId)
                        .Select(f => f.Name)
                        .First();
                    return $"{fieldName}: {m.ExcelColumn}";
                })
                .ToList();

            _context.MasterPlanFieldMappings.RemoveRange(existing);

            var masterPlan = await _context.MasterPlans.FirstAsync(mp => mp.Id == masterPlanId);

            await _context.SaveChangesAsync();

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "MasterPlanFieldMapping",
                masterPlanId,
                username,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = masterPlanId,
                    ["BelongsToMasterPlan"] = masterPlan.Name + $" (ID: {masterPlanId})",
                    ["Mappings"] = oldMapNamed.Count > 0 ? string.Join("<br>", oldMapNamed) : "—",
                }
            );

            return Ok();
        }

        [HttpPost("import")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ImportExcel(
            [FromForm] IFormFile file,
            [FromForm] int masterPlanId
        )
        {
            if (file == null)
                return BadRequest();

            var mappings = await _context
                .MasterPlanFieldMappings.Where(x => x.MasterPlanId == masterPlanId)
                .ToListAsync();

            if (mappings.Count == 0)
                return Ok(new List<object>());

            using var stream = file.OpenReadStream();
            using var package = new ExcelPackage(stream);
            var sheet = package.Workbook.Worksheets.First();
            int lastRow = sheet.Dimension.End.Row;

            var result = new List<object>();

            for (int row = 1; row <= lastRow; row++)
            {
                var rowValues = new Dictionary<int, string>();
                bool hasAnyValue = false;

                foreach (var map in mappings)
                {
                    int colIndex = GetColumnIndex(map.ExcelColumn);
                    string value = sheet.Cells[row, colIndex].Text;
                    rowValues[map.FieldId] = value;
                    if (!string.IsNullOrWhiteSpace(value))
                        hasAnyValue = true;
                }

                if (hasAnyValue)
                    result.Add(new { values = rowValues });
            }

            return Ok(result);
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
