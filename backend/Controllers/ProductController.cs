using backend.Data;
using backend.Dtos.MasterPlan;
using backend.Dtos.Product;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("product")]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public ProductController(
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
            [FromQuery] int[]? masterPlanFieldIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<Product> query = _context
                .Products.Include(p => p.ProductToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField);

            if (masterPlanIds?.Any() == true)
            {
                query = query.Where(p =>
                    p.ProductToMasterPlans.Any(mp => masterPlanIds.Contains(mp.MasterPlanId))
                );
            }

            if (masterPlanFieldIds?.Any() == true)
            {
                query = query.Where(p =>
                    p.ProductToMasterPlanFields.Any(mp =>
                        masterPlanFieldIds.Contains(mp.MasterPlanFieldId)
                    )
                );
            }

            if (isHidden.HasValue)
            {
                query = query.Where(p => p.IsHidden == isHidden.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(lowered));
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(p => p.Name.ToLower())
                    : query.OrderBy(p => p.Name.ToLower()),
                "masterplancount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(p => p.ProductToMasterPlans.Count())
                        .ThenBy(p => p.Name.ToLower())
                    : query
                        .OrderBy(p => p.ProductToMasterPlans.Count())
                        .ThenBy(p => p.Name.ToLower()),
                "masterplanfieldcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(p => p.ProductToMasterPlanFields.Count())
                        .ThenBy(p => p.Name.ToLower())
                    : query
                        .OrderBy(p => p.ProductToMasterPlanFields.Count())
                        .ThenBy(p => p.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(p => p.Id)
                    : query.OrderBy(p => p.Id),
            };

            query = query
                .Include(p => p.ProductToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField);

            var totalCount = await query.CountAsync();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.Products.CountAsync(p => !p.IsHidden),
                ["Hidden"] = await _context.Products.CountAsync(p => p.IsHidden),
            };

            var masterPlanCount = await _context
                .Products.SelectMany(p => p.ProductToMasterPlans)
                .GroupBy(mp => mp.MasterPlanId)
                .Select(ug => new { MasterPlanId = ug.Key, Count = ug.Count() })
                .ToDictionaryAsync(x => x.MasterPlanId, x => x.Count);

            var masterPlanFieldCount = await _context
                .Products.SelectMany(p => p.ProductToMasterPlanFields)
                .GroupBy(mpf => mpf.MasterPlanFieldId)
                .Select(ug => new { MasterPlanFieldId = ug.Key, Count = ug.Count() })
                .ToDictionaryAsync(x => x.MasterPlanFieldId, x => x.Count);

            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    MasterPlans = p
                        .ProductToMasterPlans.Select(mp => new MasterPlanDto
                        {
                            Id = mp.MasterPlan.Id,
                            Name = mp.MasterPlan.Name,
                        })
                        .ToList(),
                    MasterPlanFields = p
                        .ProductToMasterPlanFields.Select(mpf => new MasterPlanFieldDto
                        {
                            Id = mpf.MasterPlanField.Id,
                            Name = mpf.MasterPlanField.Name,
                            DataType = mpf.MasterPlanField.DataType,
                            Value = mpf.Value,
                        })
                        .ToList(),
                    IsHidden = p.IsHidden,

                    // Meta data.
                    CreationDate = p.CreationDate,
                    CreatedBy = p.CreatedBy,
                    UpdateDate = p.UpdateDate,
                    UpdatedBy = p.UpdatedBy,
                })
                .ToListAsync();

            var result = new
            {
                totalCount,
                items = products,
                counts = new
                {
                    visibilityCount = visibilityCount,
                    masterPlanCount = masterPlanCount,
                    masterPlanFieldCount = masterPlanFieldCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var lang = await GetLangAsync();
            var product = await _context
                .Products.Include(p => p.ProductToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound(new { message = await _t.GetAsync("Product/NotFound", lang) });
            }

            var result = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                MasterPlans = product
                    .ProductToMasterPlans.Select(pst => pst.MasterPlan)
                    .Select(mp => new MasterPlanDto { Id = mp.Id, Name = mp.Name })
                    .ToList(),
                MasterPlanFields = product
                    .ProductToMasterPlanFields.OrderBy(x => x.MasterPlanFieldId)
                    .Select(x => new MasterPlanFieldDto
                    {
                        Id = x.MasterPlanField.Id,
                        Name = x.MasterPlanField.Name,
                        DataType = x.MasterPlanField.DataType,
                        Value = x.Value,
                    })
                    .ToList(),
                IsHidden = product.IsHidden,
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
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
            var product = await _context
                .Products.Include(p => p.ProductToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound(new { message = await _t.GetAsync("Product/NotFound", lang) });
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "Product",
                product.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = product.Id,
                    ["Name"] = product.Name,
                    ["MasterPlans"] = product
                        .ProductToMasterPlans.Select(p => p.MasterPlanId)
                        .ToList(),
                    ["MasterPlanFields"] = product
                        .ProductToMasterPlanFields.OrderBy(x => x.MasterPlanFieldId)
                        .Select(x => new
                        {
                            Id = x.MasterPlanFieldId,
                            Name = x.MasterPlanField.Name,
                            DataType = x.MasterPlanField.DataType.ToString(),
                            Value = x.Value,
                        })
                        .ToList(),
                    ["IsHidden"] = product.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("Product/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct(CreateProductDto dto)
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

            var existingProduct = await _context.Products.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingProduct != null)
            {
                return BadRequest(new { message = await _t.GetAsync("Product/NameTaken", lang) });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var mpIds = dto.MasterPlanIds ?? Array.Empty<int>();
            var fieldIds = (dto.ProductFieldValues ?? new List<ProductFieldValueDto>())
                .Select(x => x.MasterPlanFieldId)
                .Distinct()
                .ToArray();

            if (mpIds.Length > 0 && fieldIds.Length > 0)
            {
                var missing = await GetMissingFieldsByMasterPlanAsync(mpIds, fieldIds);

                if (missing.Any())
                {
                    var mpNames = await _context
                        .MasterPlans.Where(x => missing.Keys.Contains(x.Id))
                        .Select(x => new { x.Id, x.Name })
                        .ToDictionaryAsync(x => x.Id, x => x.Name);

                    var fieldNames = await _context
                        .MasterPlanFields.Where(x => fieldIds.Contains(x.Id))
                        .Select(x => new { x.Id, x.Name })
                        .ToDictionaryAsync(x => x.Id, x => x.Name);

                    var parts = missing.Select(kvp =>
                        $"{mpNames.GetValueOrDefault(kvp.Key, $"#{kvp.Key}")}: "
                        + string.Join(
                            ", ",
                            kvp.Value.Select(id => fieldNames.GetValueOrDefault(id, $"#{id}"))
                        )
                    );

                    return BadRequest(new { message = string.Join(" | ", parts) });
                }
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var product = new Product
            {
                Name = dto.Name,
                ProductToMasterPlans = (dto.MasterPlanIds ?? Array.Empty<int>())
                    .Select(mpId => new ProductToMasterPlan { MasterPlanId = mpId })
                    .ToList(),
                ProductToMasterPlanFields = (dto.MasterPlanFieldIds ?? Array.Empty<int>())
                    .Select(mpfId => new ProductToMasterPlanField { MasterPlanFieldId = mpfId })
                    .ToList(),
                IsHidden = dto.IsHidden,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            product.ProductToMasterPlanFields = (
                dto.ProductFieldValues ?? new List<ProductFieldValueDto>()
            )
                .Select(x => new ProductToMasterPlanField
                {
                    MasterPlanFieldId = x.MasterPlanFieldId,
                    Value = x.Value ?? "",
                })
                .DistinctBy(x => x.MasterPlanFieldId)
                .ToList();

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var result = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                MasterPlans = new List<MasterPlanDto>(),
                MasterPlanFields = new List<MasterPlanFieldDto>(),

                // Meta data.
                CreationDate = product.CreationDate,
                CreatedBy = product.CreatedBy,
                UpdateDate = product.UpdateDate,
                UpdatedBy = product.UpdatedBy,
            };

            var dtoFieldIds = (dto.ProductFieldValues ?? new List<ProductFieldValueDto>())
                .Select(x => x.MasterPlanFieldId)
                .Distinct()
                .ToArray();

            var fieldMeta = await _context
                .MasterPlanFields.Where(f => dtoFieldIds.Contains(f.Id))
                .Select(f => new
                {
                    f.Id,
                    f.Name,
                    DataType = f.DataType.ToString(),
                })
                .ToDictionaryAsync(x => x.Id, x => x);

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "Product",
                product.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = product.Id,
                    ["Name"] = product.Name,
                    ["MasterPlans"] = dto.MasterPlanIds,
                    ["MasterPlanFields"] = product
                        .ProductToMasterPlanFields.OrderBy(x => x.MasterPlanFieldId)
                        .Select(x => new
                        {
                            Id = x.MasterPlanFieldId,
                            Name = fieldMeta.TryGetValue(x.MasterPlanFieldId, out var meta)
                                ? meta.Name
                                : $"#{x.MasterPlanFieldId}",
                            DataType = fieldMeta.TryGetValue(x.MasterPlanFieldId, out var meta2)
                                ? meta2.DataType
                                : "",
                            Value = x.Value,
                        })
                        .ToList(),
                    ["IsHidden"] = dto.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto dto)
        {
            var lang = await GetLangAsync();
            var product = await _context
                .Products.Include(p => p.ProductToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound(new { message = await _t.GetAsync("Product/NotFound", lang) });
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

            var existingProduct = await _context.Products.FirstOrDefaultAsync(p =>
                p.Name.ToLower() == dto.Name.ToLower() && p.Id != id
            );

            if (existingProduct != null)
            {
                return BadRequest(new { message = await _t.GetAsync("Product/NameTaken", lang) });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var mpIds = dto.MasterPlanIds ?? Array.Empty<int>();
            var fieldIds = (dto.ProductFieldValues ?? new List<ProductFieldValueDto>())
                .Select(x => x.MasterPlanFieldId)
                .Distinct()
                .ToArray();

            if (mpIds.Length > 0 && fieldIds.Length > 0)
            {
                var missing = await GetMissingFieldsByMasterPlanAsync(mpIds, fieldIds);

                if (missing.Any())
                {
                    var mpNames = await _context
                        .MasterPlans.Where(x => missing.Keys.Contains(x.Id))
                        .Select(x => new { x.Id, x.Name })
                        .ToDictionaryAsync(x => x.Id, x => x.Name);

                    var fieldNames = await _context
                        .MasterPlanFields.Where(x => fieldIds.Contains(x.Id))
                        .Select(x => new { x.Id, x.Name })
                        .ToDictionaryAsync(x => x.Id, x => x.Name);

                    var parts = missing.Select(kvp =>
                        $"{mpNames.GetValueOrDefault(kvp.Key, $"#{kvp.Key}")}: "
                        + string.Join(
                            ", ",
                            kvp.Value.Select(id => fieldNames.GetValueOrDefault(id, $"#{id}"))
                        )
                    );

                    return BadRequest(new { message = string.Join(" | ", parts) });
                }
            }

            var conflicts = await ValidateProductGroupsCompatibilityAsync(
                id,
                mpIds,
                fieldIds,
                lang
            );
            if (conflicts.Count > 0)
            {
                return BadRequest(new { messages = conflicts });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = product.Id,
                ["Name"] = product.Name,
                ["MasterPlans"] = product.ProductToMasterPlans.Select(p => p.MasterPlanId).ToList(),
                ["MasterPlanFields"] = product
                    .ProductToMasterPlanFields.OrderBy(x => x.MasterPlanFieldId)
                    .Select(x => new
                    {
                        Id = x.MasterPlanFieldId,
                        Name = x.MasterPlanField.Name,
                        DataType = x.MasterPlanField.DataType.ToString(),
                        Value = x.Value,
                    })
                    .ToList(),
                ["IsHidden"] = product.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
            };

            product.Name = dto.Name;
            product.ProductToMasterPlans = (dto.MasterPlanIds ?? Array.Empty<int>())
                .Select(mpId => new ProductToMasterPlan { MasterPlanId = mpId })
                .ToList();
            product.ProductToMasterPlanFields = (
                dto.ProductFieldValues ?? new List<ProductFieldValueDto>()
            )
                .Select(x => new ProductToMasterPlanField
                {
                    MasterPlanFieldId = x.MasterPlanFieldId,
                    Value = x.Value ?? "",
                })
                .DistinctBy(x => x.MasterPlanFieldId)
                .ToList();
            product.IsHidden = dto.IsHidden;

            // Meta data.
            product.UpdateDate = now;
            product.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var masterPlanIds = product.ProductToMasterPlans.Select(x => x.MasterPlanId).ToList();

            var masterPlanFieldIds = product
                .ProductToMasterPlanFields.Select(x => x.MasterPlanFieldId)
                .ToList();

            var masterPlans = await _context
                .MasterPlans.Where(mp => masterPlanIds.Contains(mp.Id))
                .Select(mp => new MasterPlanDto { Id = mp.Id, Name = mp.Name })
                .ToListAsync();

            var masterPlanFields = await _context
                .MasterPlanFields.Where(mpf => masterPlanFieldIds.Contains(mpf.Id))
                .Select(mpf => new MasterPlanFieldDto { Id = mpf.Id, Name = mpf.Name })
                .ToListAsync();

            var dtoFieldIds = (dto.ProductFieldValues ?? new List<ProductFieldValueDto>())
                .Select(x => x.MasterPlanFieldId)
                .Distinct()
                .ToArray();

            var fieldMeta = await _context
                .MasterPlanFields.Where(f => dtoFieldIds.Contains(f.Id))
                .Select(f => new
                {
                    f.Id,
                    f.Name,
                    DataType = f.DataType.ToString(),
                })
                .ToDictionaryAsync(x => x.Id, x => x);

            var newMasterPlanFields = (dto.ProductFieldValues ?? new List<ProductFieldValueDto>())
                .GroupBy(x => x.MasterPlanFieldId)
                .Select(g => g.First())
                .OrderBy(x => x.MasterPlanFieldId)
                .Select(x => new
                {
                    Id = x.MasterPlanFieldId,
                    Name = fieldMeta.TryGetValue(x.MasterPlanFieldId, out var meta)
                        ? meta.Name
                        : $"#{x.MasterPlanFieldId}",
                    DataType = fieldMeta.TryGetValue(x.MasterPlanFieldId, out var meta2)
                        ? meta2.DataType
                        : "",
                    Value = x.Value ?? "",
                })
                .ToList();

            var result = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                MasterPlans = masterPlans,
                MasterPlanFields = masterPlanFields,
                IsHidden = product.IsHidden,

                // Meta data.
                UpdateDate = product.UpdateDate,
                UpdatedBy = product.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "Product",
                product.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = product.Id,
                        ["Name"] = product.Name,
                        ["MasterPlans"] = dto.MasterPlanIds,
                        ["MasterPlanFields"] = newMasterPlanFields,
                        ["IsHidden"] = dto.IsHidden
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                    },
                }
            );

            return Ok(result);
        }

        private async Task<Dictionary<int, List<int>>> GetMissingFieldsByMasterPlanAsync(
            int[] masterPlanIds,
            int[] masterPlanFieldIds
        )
        {
            var allowed = await _context
                .MasterPlanToMasterPlanFields.Where(x => masterPlanIds.Contains(x.MasterPlanId))
                .Select(x => new { x.MasterPlanId, x.MasterPlanFieldId })
                .ToListAsync();

            var allowedSet = allowed.Select(x => (x.MasterPlanId, x.MasterPlanFieldId)).ToHashSet();

            var missing = new Dictionary<int, List<int>>();

            foreach (var mpId in masterPlanIds)
            {
                foreach (var fieldId in masterPlanFieldIds)
                {
                    if (!allowedSet.Contains((mpId, fieldId)))
                    {
                        if (!missing.ContainsKey(mpId))
                            missing[mpId] = new List<int>();
                        missing[mpId].Add(fieldId);
                    }
                }
            }

            return missing;
        }

        [HttpGet("required-fields")]
        [Authorize]
        public async Task<IActionResult> GetRequiredFields([FromQuery] int[] productIds)
        {
            if (productIds == null || productIds.Length == 0)
            {
                return Ok(new { fieldIds = Array.Empty<int>() });
            }

            var fieldIds = await _context
                .Products.Where(p => productIds.Contains(p.Id))
                .SelectMany(p => p.ProductToMasterPlanFields)
                .Select(x => x.MasterPlanFieldId)
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            return Ok(new { fieldIds });
        }

        private async Task<List<string>> ValidateProductGroupsCompatibilityAsync(
            int productId,
            int[] newProductMasterPlanIds,
            int[] newProductFieldIds,
            string lang
        )
        {
            var groups = await _context
                .ProductGroups.Where(pg =>
                    pg.ProductGroupToProducts.Any(x => x.ProductId == productId)
                )
                .Select(pg => new
                {
                    pg.Id,
                    pg.Name,
                    MasterPlanIds = pg
                        .ProductGroupToMasterPlans.Select(x => x.MasterPlanId)
                        .ToList(),
                })
                .ToListAsync();

            if (!groups.Any())
                return new List<string>();

            var allMpIds = groups.SelectMany(g => g.MasterPlanIds).Distinct().ToArray();

            var mpNames = await _context
                .MasterPlans.Where(mp => allMpIds.Contains(mp.Id))
                .Select(mp => new { mp.Id, mp.Name })
                .ToDictionaryAsync(x => x.Id, x => x.Name);

            var fieldNames = await _context
                .MasterPlanFields.Where(f => newProductFieldIds.Contains(f.Id))
                .Select(f => new { f.Id, f.Name })
                .ToDictionaryAsync(x => x.Id, x => x.Name);

            var requiresFieldsTemplate = await _t.GetAsync("ProductGroup/RequiresFields", lang);

            var messages = new List<string>();

            foreach (var g in groups)
            {
                var groupMpIds = g.MasterPlanIds.Distinct().ToArray();

                if (groupMpIds.Length == 0 || newProductFieldIds.Length == 0)
                    continue;

                var missingFieldsByMp = await GetMissingFieldsByMasterPlanAsync(
                    groupMpIds,
                    newProductFieldIds
                );

                foreach (var kvp in missingFieldsByMp.OrderBy(x => x.Key))
                {
                    if (kvp.Value == null || kvp.Value.Count == 0)
                        continue;

                    var mpName = mpNames.GetValueOrDefault(kvp.Key, $"#{kvp.Key}");

                    var fieldsText = string.Join(
                        ", ",
                        kvp.Value.Distinct()
                            .OrderBy(x => x)
                            .Select(id => fieldNames.GetValueOrDefault(id, $"#{id}"))
                    );

                    messages.Add(string.Format(requiresFieldsTemplate, g.Name, mpName, fieldsText));
                }
            }

            return messages;
        }
    }
}
