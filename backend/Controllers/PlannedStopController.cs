using backend.Data;
using backend.Dtos.MasterPlan;
using backend.Dtos.PlannedStop;
using backend.Dtos.Unit;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("planned-stop")]
    public class PlannedStopController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public PlannedStopController(
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

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] int[]? masterPlanIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var lang = await GetLangAsync();

            IQueryable<PlannedStop> query = _context
                .PlannedStops.Include(st => st.PlannedStopToMasterPlans)
                .ThenInclude(ust => ust.MasterPlan);

            if (isHidden.HasValue)
            {
                query = query.Where(s => s.IsHidden == isHidden.Value);
            }

            if (masterPlanIds?.Any() == true)
            {
                query = query.Where(p =>
                    p.PlannedStopToMasterPlans.Any(pst => masterPlanIds.Contains(pst.MasterPlanId))
                );
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(t => t.Name.ToLower().Contains(lowered));
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(t => t.Name.ToLower())
                    : query.OrderBy(t => t.Name.ToLower()),
                "masterplancount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(t => t.PlannedStopToMasterPlans.Count)
                        .ThenBy(st => st.Name.ToLower())
                    : query
                        .OrderBy(st => st.PlannedStopToMasterPlans.Count)
                        .ThenBy(st => st.Name.ToLower()),
                "visibilitycount" => sortOrder == "desc"
                    ? query.OrderByDescending(t => t.IsHidden).ThenBy(t => t.Name.ToLower())
                    : query.OrderBy(t => t.IsHidden).ThenBy(t => t.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(t => t.Id)
                    : query.OrderBy(t => t.Id),
            };

            var totalCount = await query.CountAsync();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.PlannedStops.CountAsync(s => !s.IsHidden),
                ["Hidden"] = await _context.PlannedStops.CountAsync(s => s.IsHidden),
            };

            var masterPlanCount = await _context
                .PlannedStops.SelectMany(p => p.PlannedStopToMasterPlans)
                .GroupBy(mp => mp.MasterPlanId)
                .Select(ug => new { MasterPlanId = ug.Key, Count = ug.Count() })
                .ToDictionaryAsync(x => x.MasterPlanId, x => x.Count);

            var plannedStops = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new PlannedStopDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    LightColorHex = t.LightColorHex,
                    DarkColorHex = t.DarkColorHex,
                    LightTextColorHex = ColorHelper.GetReadableTextColor(t.LightColorHex),
                    DarkTextColorHex = ColorHelper.GetReadableTextColor(t.DarkColorHex),
                    ReverseColor = t.ReverseColor,
                    MasterPlans = t
                        .PlannedStopToMasterPlans.Select(pst => pst.MasterPlan)
                        .Select(mp => new MasterPlanDto { Id = mp.Id, Name = mp.Name })
                        .ToList(),

                    IsHidden = t.IsHidden,

                    // Meta data.
                    CreationDate = t.CreationDate,
                    CreatedBy = t.CreatedBy,
                    UpdateDate = t.UpdateDate,
                    UpdatedBy = t.UpdatedBy,
                })
                .ToListAsync();

            var result = new
            {
                totalCount,
                items = plannedStops,
                counts = new { visibilityCount, masterPlanCount },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetPlannedStop(int id)
        {
            var lang = await GetLangAsync();
            var plannedStop = await _context
                .PlannedStops.Include(st => st.PlannedStopToMasterPlans)
                .ThenInclude(pst => pst.MasterPlan)
                .FirstOrDefaultAsync(st => st.Id == id);

            if (plannedStop == null)
            {
                return NotFound(new { message = await _t.GetAsync("PlannedStop/NotFound", lang) });
            }

            var result = new PlannedStopDto
            {
                Id = plannedStop.Id,
                Name = plannedStop.Name,
                LightColorHex = plannedStop.LightColorHex,
                DarkColorHex = plannedStop.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(plannedStop.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(plannedStop.DarkColorHex),
                ReverseColor = plannedStop.ReverseColor,
                MasterPlans = plannedStop
                    .PlannedStopToMasterPlans.Select(pst => pst.MasterPlan)
                    .Select(mp => new MasterPlanDto { Id = mp.Id, Name = mp.Name })
                    .ToList(),
                IsHidden = plannedStop.IsHidden,
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePlannedStop(int id)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (deletedBy, userId) = userInfo.Value;
            var plannedStop = await _context.PlannedStops.FindAsync(id);

            if (plannedStop == null)
            {
                return NotFound(new { message = await _t.GetAsync("PlannedStop/NotFound", lang) });
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "PlannedStop",
                plannedStop.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = plannedStop.Id,
                    ["Name"] = plannedStop.Name,
                    ["LightColorHex"] = plannedStop.LightColorHex,
                    ["DarkColorHex"] = plannedStop.DarkColorHex,
                    ["ReverseColor"] = plannedStop.ReverseColor
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                    ["MasterPlans"] = plannedStop
                        .PlannedStopToMasterPlans.Select(p => p.MasterPlanId)
                        .ToList(),
                    ["IsHidden"] = plannedStop.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            _context.PlannedStops.Remove(plannedStop);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("PlannedStop/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePlannedStop(CreatePlannedStopDto dto)
        {
            var lang = await GetLangAsync();
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(
                    new { message = await _t.GetAsync("Common/ValidationError", lang), errors }
                );
            }

            var existingPlannedStop = await _context.PlannedStops.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingPlannedStop != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("PlannedStop/NameTaken", lang) }
                );
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var plannedStop = new PlannedStop
            {
                Name = dto.Name,
                LightColorHex = dto.LightColorHex,
                DarkColorHex = dto.DarkColorHex,
                ReverseColor = dto.ReverseColor,
                PlannedStopToMasterPlans = (dto.MasterPlanIds ?? Array.Empty<int>())
                    .Select(mpId => new PlannedStopToMasterPlan { MasterPlanId = mpId })
                    .ToList(),
                IsHidden = dto.IsHidden,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.PlannedStops.Add(plannedStop);
            await _context.SaveChangesAsync();

            var result = new PlannedStopDto
            {
                Id = plannedStop.Id,
                Name = plannedStop.Name,
                LightColorHex = plannedStop.LightColorHex,
                DarkColorHex = plannedStop.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(plannedStop.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(plannedStop.DarkColorHex),
                ReverseColor = plannedStop.ReverseColor,
                MasterPlans = new List<MasterPlanDto>(),
                IsHidden = plannedStop.IsHidden,

                // Meta data.
                CreationDate = plannedStop.CreationDate,
                CreatedBy = plannedStop.CreatedBy,
                UpdateDate = plannedStop.UpdateDate,
                UpdatedBy = plannedStop.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "PlannedStop",
                plannedStop.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = plannedStop.Id,
                    ["Name"] = plannedStop.Name,
                    ["LightColorHex"] = plannedStop.LightColorHex,
                    ["DarkColorHex"] = plannedStop.DarkColorHex,
                    ["ReverseColor"] = plannedStop.ReverseColor
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                    ["MasterPlans"] = plannedStop
                        .PlannedStopToMasterPlans.Select(p => p.MasterPlanId)
                        .ToList(),
                    ["IsHidden"] = plannedStop.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePlannedStop(int id, UpdatePlannedStopDto dto)
        {
            var lang = await GetLangAsync();
            var plannedStop = await _context.PlannedStops.FindAsync(id);

            if (plannedStop == null)
            {
                return NotFound(new { message = await _t.GetAsync("PlannedStop/NotFound", lang) });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(
                    new { message = await _t.GetAsync("Common/ValidationError", lang), errors }
                );
            }

            var existingPlannedStop = await _context.PlannedStops.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower() && t.Id != id
            );

            if (existingPlannedStop != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("PlannedStop/NameTaken", lang) }
                );
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = plannedStop.Id,
                ["Name"] = plannedStop.Name,
                ["LightColorHex"] = plannedStop.LightColorHex,
                ["DarkColorHex"] = plannedStop.DarkColorHex,
                ["ReverseColor"] = plannedStop.ReverseColor
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
                ["MasterPlans"] = plannedStop
                    .PlannedStopToMasterPlans.Select(p => p.MasterPlanId)
                    .ToList(),
                ["IsHidden"] = plannedStop.IsHidden
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
            };

            plannedStop.Name = dto.Name;
            plannedStop.LightColorHex = dto.LightColorHex;
            plannedStop.DarkColorHex = dto.DarkColorHex;
            plannedStop.ReverseColor = dto.ReverseColor;
            plannedStop.PlannedStopToMasterPlans = (dto.MasterPlanIds ?? Array.Empty<int>())
                .Select(mpId => new PlannedStopToMasterPlan { MasterPlanId = mpId })
                .ToList();
            plannedStop.IsHidden = dto.IsHidden;

            // Meta data.
            plannedStop.UpdateDate = now;
            plannedStop.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new PlannedStopDto
            {
                Id = plannedStop.Id,
                Name = plannedStop.Name,
                LightColorHex = plannedStop.LightColorHex,
                DarkColorHex = plannedStop.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(plannedStop.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(plannedStop.DarkColorHex),
                ReverseColor = plannedStop.ReverseColor,
                MasterPlans = plannedStop
                    .PlannedStopToMasterPlans.Select(pst => pst.MasterPlan)
                    .Select(mp => new MasterPlanDto { Id = mp.Id, Name = mp.Name })
                    .ToList(),
                IsHidden = plannedStop.IsHidden,

                // Meta data.
                UpdateDate = plannedStop.UpdateDate,
                UpdatedBy = plannedStop.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "PlannedStop",
                plannedStop.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = plannedStop.Id,
                        ["Name"] = plannedStop.Name,
                        ["LightColorHex"] = plannedStop.LightColorHex,
                        ["DarkColorHex"] = plannedStop.DarkColorHex,
                        ["ReverseColor"] = plannedStop.ReverseColor
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                        ["MasterPlans"] = plannedStop
                            .PlannedStopToMasterPlans.Select(p => p.MasterPlanId)
                            .ToList(),
                        ["IsHidden"] = plannedStop.IsHidden
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                    },
                }
            );

            return Ok(result);
        }
    }
}
