using System.Linq;
using backend.Data;
using backend.Dtos.OperationalPlan;
using backend.Hubs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("operational-plan")]
    public class OperationalPlanController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;
        private readonly IHubContext<OperationalPlanHub> _hub;

        public OperationalPlanController(
            AppDbContext context,
            UserService userService,
            ITranslationService t,
            AuditTrailService audit,
            IHubContext<OperationalPlanHub> hub
        )
        {
            _context = context;
            _userService = userService;
            _t = t;
            _audit = audit;
            _hub = hub;
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

            IQueryable<OperationalPlan> query = _context.OperationalPlans.Include(op =>
                op.MasterPlan
            );

            if (isHidden.HasValue)
            {
                query = query.Where(op => op.IsHidden == isHidden.Value);
            }

            if (masterPlanIds?.Any() == true)
            {
                query = query.Where(op =>
                    op.MasterPlanId.HasValue && masterPlanIds.Contains(op.MasterPlanId.Value)
                );
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(op => op.Name.ToLower().Contains(lowered));
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(op => op.Name.ToLower())
                    : query.OrderBy(op => op.Name.ToLower()),
                "masterplanname" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(op => op.MasterPlan == null ? "" : op.MasterPlan.Name)
                        .ThenBy(op => op.Name.ToLower())
                    : query
                        .OrderBy(op => op.MasterPlan == null ? "" : op.MasterPlan.Name)
                        .ThenBy(op => op.Name.ToLower()),
                "visibilitycount" => sortOrder == "desc"
                    ? query.OrderByDescending(op => op.IsHidden)
                    : query.OrderBy(op => op.IsHidden),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(op => op.Id)
                    : query.OrderBy(op => op.Id),
            };

            var totalCount = await query.CountAsync();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.OperationalPlans.CountAsync(op => !op.IsHidden),
                ["Hidden"] = await _context.OperationalPlans.CountAsync(op => op.IsHidden),
            };

            var masterPlanCount = _context
                .OperationalPlans.Include(op => op.MasterPlan)
                .AsEnumerable()
                .GroupBy(op => op.MasterPlan == null ? "" : op.MasterPlan.Name)
                .ToDictionary(g => g.Key, g => g.Count());

            var operationalPlans = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsEnumerable()
                .Select(t => new OperationalPlanDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    MasterPlanId = t.MasterPlanId,
                    MasterPlanName = t.MasterPlan == null ? "" : t.MasterPlan.Name,
                    IsHidden = t.IsHidden,

                    // Meta data.
                    CreationDate = t.CreationDate,
                    CreatedBy = t.CreatedBy,
                    UpdateDate = t.UpdateDate,
                    UpdatedBy = t.UpdatedBy,
                })
                .ToList();

            var result = new
            {
                totalCount,
                items = operationalPlans,
                counts = new { visibilityCount, masterPlanCount },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetOperationalPlan(int id)
        {
            var lang = await GetLangAsync();
            var operationalPlan = await _context
                .OperationalPlans.Include(op => op.MasterPlan)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (operationalPlan == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("OperationalPlan/NotFound", lang) }
                );
            }

            var unknownMasterPlan = await _t.GetAsync("MasterPlan/Unknown", lang);

            var result = new OperationalPlanDto
            {
                Id = operationalPlan.Id,
                Name = operationalPlan.Name,
                MasterPlanId = operationalPlan.MasterPlanId,
                MasterPlanName = operationalPlan.MasterPlan?.Name ?? unknownMasterPlan,
                IsHidden = operationalPlan.IsHidden,
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOperationalPlan(int id)
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
            var operationalPlan = await _context
                .OperationalPlans.Include(op => op.MasterPlan)
                .FirstOrDefaultAsync(op => op.Id == id);

            if (operationalPlan == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("OperationalPlan/NotFound", lang) }
                );
            }

            // var isInUse = await _context.MasterPlans.AnyAsync(mp =>
            //     mp.OperationalPlans.Any(op => op.Id == id)
            // );

            // if (isInUse)
            // {
            //     return BadRequest(
            //         new { message = await _t.GetAsync("OperationalPlan/InUse", lang) }
            //     );
            // }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "OperationalPlan",
                operationalPlan.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = operationalPlan.Id,
                    ["Name"] = operationalPlan.Name,
                    ["MasterPlan"] =
                        operationalPlan.MasterPlan == null
                            ? "—"
                            : $"{operationalPlan.MasterPlan.Name} (ID: {operationalPlan.MasterPlanId})",
                    ["IsHidden"] = operationalPlan.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            _context.OperationalPlans.Remove(operationalPlan);

            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("OperationalPlan/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateOperationalPlan(CreateOperationalPlanDto dto)
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

            var masterPlan = await _context.MasterPlans.FindAsync(dto.MasterPlanId);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
            }

            var existingOperationalPlan = await _context.OperationalPlans.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingOperationalPlan != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("OperationalPlan/NameTaken", lang) }
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

            var operationalPlan = new OperationalPlan
            {
                Name = dto.Name,
                MasterPlan = masterPlan,
                IsHidden = dto.IsHidden,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.OperationalPlans.Add(operationalPlan);
            await _context.SaveChangesAsync();

            var result = new OperationalPlanDto
            {
                Id = operationalPlan.Id,
                Name = operationalPlan.Name,
                MasterPlanId = operationalPlan.MasterPlanId,
                IsHidden = operationalPlan.IsHidden,

                // Meta data.
                CreationDate = operationalPlan.CreationDate,
                CreatedBy = operationalPlan.CreatedBy,
                UpdateDate = operationalPlan.UpdateDate,
                UpdatedBy = operationalPlan.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "OperationalPlan",
                operationalPlan.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = operationalPlan.Id,
                    ["Name"] = operationalPlan.Name,
                    ["MasterPlan"] =
                        operationalPlan.MasterPlan == null
                            ? "—"
                            : $"{operationalPlan.MasterPlan.Name} (ID: {operationalPlan.MasterPlanId})",
                    ["IsHidden"] = operationalPlan.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOperationalPlan(int id, UpdateOperationalPlanDto dto)
        {
            var lang = await GetLangAsync();
            var operationalPlan = await _context
                .OperationalPlans.Include(op => op.MasterPlan)
                .FirstOrDefaultAsync(op => op.Id == id);

            if (operationalPlan == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("OperationalPlan/NotFound", lang) }
                );
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

            var masterPlan = await _context.MasterPlans.FindAsync(dto.MasterPlanId);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
            }

            var existingOperationalPlan = await _context.OperationalPlans.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower() && t.Id != id
            );

            if (
                existingOperationalPlan != null
                && existingOperationalPlan.MasterPlanId == masterPlan.Id
            )
            {
                return BadRequest(
                    new { message = await _t.GetAsync("OperationalPlan/NameTaken", lang) }
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
                ["ObjectID"] = operationalPlan.Id,
                ["Name"] = operationalPlan.Name,
                ["MasterPlan"] =
                    operationalPlan.MasterPlan == null
                        ? "—"
                        : $"{operationalPlan.MasterPlan.Name} (ID: {operationalPlan.MasterPlanId})",
                ["IsHidden"] = operationalPlan.IsHidden
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
            };

            operationalPlan.Name = dto.Name;
            operationalPlan.IsHidden = dto.IsHidden;
            operationalPlan.MasterPlan = masterPlan;

            masterPlan.UpdateDate = now;
            masterPlan.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new OperationalPlanDto
            {
                Id = operationalPlan.Id,
                Name = operationalPlan.Name,
                MasterPlanId = operationalPlan.MasterPlanId,
                IsHidden = operationalPlan.IsHidden,

                // Meta data.
                UpdateDate = operationalPlan.UpdateDate,
                UpdatedBy = operationalPlan.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "OperationalPlan",
                operationalPlan.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = operationalPlan.Id,
                        ["Name"] = operationalPlan.Name,
                        ["MasterPlan"] =
                            operationalPlan.MasterPlan == null
                                ? "—"
                                : $"{operationalPlan.MasterPlan.Name} (ID: {operationalPlan.MasterPlanId})",
                        ["IsHidden"] = operationalPlan.IsHidden
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                    },
                }
            );

            return Ok(result);
        }

        [HttpPost("check/{id}")]
        [Authorize(Roles = "Planner")]
        public async Task<IActionResult> Check(
            int id,
            [FromQuery] bool force = false,
            [FromQuery] bool cancelled = false
        )
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (username, userId) = userInfo.Value;
            var operationalPlan = await _context.OperationalPlans.FirstOrDefaultAsync(op =>
                op.Id == id
            );
            if (operationalPlan == null)
                return NotFound(
                    new { message = await _t.GetAsync("OperationalPlan/NotFound", lang) }
                );

            // If already checked out.
            if (operationalPlan.IsCheckedOut)
            {
                // Check if same user. If so - check in.
                if (operationalPlan.CheckedOutBy == username)
                {
                    operationalPlan.IsCheckedOut = false;
                    operationalPlan.CheckedOutBy = null;
                    operationalPlan.CheckedOutAt = null;
                    operationalPlan.UpdateDate = DateTime.UtcNow;
                    operationalPlan.UpdatedBy = username;
                    await _context.SaveChangesAsync();

                    // Notify all clients that plan was checked in.
                    if (
                        OperationalPlanHub.UserConnections.TryGetValue(
                            username,
                            out var connectionIdIn
                        )
                    )
                    {
                        await _hub
                            .Clients.AllExcept(connectionIdIn)
                            .SendAsync(
                                "OperationalPlanCheckedIn",
                                new
                                {
                                    operationalPlanId = id,
                                    checkedInBy = username,
                                    message = "OperationalPlan/Checked in by user",
                                }
                            );
                    }
                    else
                    {
                        await _hub.Clients.All.SendAsync(
                            "OperationalPlanCheckedIn",
                            new
                            {
                                operationalPlanId = id,
                                checkedInBy = username,
                                message = "OperationalPlan/Checked in by user",
                            }
                        );
                    }

                    return Ok(
                        new
                        {
                            message = cancelled
                                ? "OperationalPlan/No changes made"
                                : "OperationalPlan/Checked in",
                            isCheckedOut = false,
                        }
                    );
                }

                // Another user has checked out.
                if (!force)
                {
                    var msg = string.Format(
                        await _t.GetAsync("OperationalPlan/CheckedOutByAnotherUser", lang),
                        operationalPlan.CheckedOutBy
                    );
                    return Conflict(new { message = msg });
                }

                // Force check out.
                operationalPlan.CheckedOutBy = username;
                operationalPlan.CheckedOutAt = DateTime.UtcNow;
                operationalPlan.UpdateDate = DateTime.UtcNow;
                operationalPlan.UpdatedBy = username;
                await _context.SaveChangesAsync();

                // Notify all clients that plan was forcefully taken over.
                if (
                    OperationalPlanHub.UserConnections.TryGetValue(
                        username,
                        out var connectionIdForce
                    )
                )
                {
                    await _hub
                        .Clients.AllExcept(connectionIdForce)
                        .SendAsync(
                            "OperationalPlanForceTakenOver",
                            new
                            {
                                operationalPlanId = id,
                                forcedBy = username,
                                message = "OperationalPlan/Force taken over",
                            }
                        );
                }
                else
                {
                    await _hub.Clients.All.SendAsync(
                        "OperationalPlanForceTakenOver",
                        new
                        {
                            operationalPlanId = id,
                            forcedBy = username,
                            message = "OperationalPlan/Force taken over",
                        }
                    );
                }

                return Ok(
                    new { message = "OperationalPlan/Force checked out", isCheckedOut = true }
                );
            }

            // Is not checked out - new check out.
            operationalPlan.IsCheckedOut = true;
            operationalPlan.CheckedOutBy = username;
            operationalPlan.CheckedOutAt = DateTime.UtcNow;
            operationalPlan.UpdateDate = DateTime.UtcNow;
            operationalPlan.UpdatedBy = username;

            await _context.SaveChangesAsync();

            // Notify all clients that plan was checked out normally.
            if (OperationalPlanHub.UserConnections.TryGetValue(username, out var connectionIdOut))
            {
                await _hub
                    .Clients.AllExcept(connectionIdOut)
                    .SendAsync(
                        "OperationalPlanCheckedOut",
                        new
                        {
                            operationalPlanId = id,
                            checkedOutBy = username,
                            message = "OperationalPlan/Checked out by user",
                        }
                    );
            }
            else
            {
                await _hub.Clients.All.SendAsync(
                    "OperationalPlanCheckedOut",
                    new
                    {
                        operationalPlanId = id,
                        checkedOutBy = username,
                        message = "OperationalPlan/Checked out by user",
                    }
                );
            }

            return Ok(new { message = "OperationalPlan/Checked out", isCheckedOut = true });
        }

        [HttpGet("check/status/{id}")]
        [Authorize(Roles = "Planner")]
        public async Task<IActionResult> CheckStatus(int id)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (username, _) = userInfo.Value;

            var operationalPlan = await _context
                .OperationalPlans.AsNoTracking()
                .Select(op => new
                {
                    op.Id,
                    op.IsCheckedOut,
                    op.CheckedOutBy,
                    op.CheckedOutAt,
                })
                .FirstOrDefaultAsync(op => op.Id == id);

            if (operationalPlan == null)
                return NotFound(
                    new { message = await _t.GetAsync("OperationalPlan/NotFound", lang) }
                );

            return Ok(
                new
                {
                    operationalPlan.Id,
                    operationalPlan.IsCheckedOut,
                    operationalPlan.CheckedOutBy,
                    operationalPlan.CheckedOutAt,
                    IsCheckedOutByMe = operationalPlan.CheckedOutBy == username,
                }
            );
        }
    }
}
