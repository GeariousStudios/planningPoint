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
    [Route("product-group")]
    public class ProductGroupController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public ProductGroupController(
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
            [FromQuery] int[]? productIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<ProductGroup> query = _context
                .ProductGroups.Include(p => p.ProductGroupToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductGroupToProducts)
                .ThenInclude(pgp => pgp.Product);

            if (masterPlanIds?.Any() == true)
            {
                query = query.Where(p =>
                    p.ProductGroupToMasterPlans.Any(mp => masterPlanIds.Contains(mp.MasterPlanId))
                );
            }

            if (productIds?.Any() == true)
            {
                query = query.Where(p =>
                    p.ProductGroupToProducts.Any(mp => productIds.Contains(mp.ProductId))
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
                        .OrderByDescending(p => p.ProductGroupToMasterPlans.Count())
                        .ThenBy(p => p.Name.ToLower())
                    : query
                        .OrderBy(p => p.ProductGroupToMasterPlans.Count())
                        .ThenBy(p => p.Name.ToLower()),
                "productcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(p => p.ProductGroupToProducts.Count())
                        .ThenBy(p => p.Name.ToLower())
                    : query
                        .OrderBy(p => p.ProductGroupToProducts.Count())
                        .ThenBy(p => p.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(p => p.Id)
                    : query.OrderBy(p => p.Id),
            };

            query = query
                .Include(p => p.ProductGroupToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductGroupToProducts)
                .ThenInclude(pgp => pgp.Product);

            var totalCount = await query.CountAsync();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.ProductGroups.CountAsync(p => !p.IsHidden),
                ["Hidden"] = await _context.ProductGroups.CountAsync(p => p.IsHidden),
            };

            var masterPlanCount = await _context
                .ProductGroups.SelectMany(p => p.ProductGroupToMasterPlans)
                .GroupBy(mp => mp.MasterPlanId)
                .Select(ug => new { MasterPlanId = ug.Key, Count = ug.Count() })
                .ToDictionaryAsync(x => x.MasterPlanId, x => x.Count);

            var productCount = await _context
                .ProductGroups.SelectMany(p => p.ProductGroupToProducts)
                .GroupBy(pgp => pgp.ProductId)
                .Select(ug => new { ProductId = ug.Key, Count = ug.Count() })
                .ToDictionaryAsync(x => x.ProductId, x => x.Count);

            var productGroups = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductGroupDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    MasterPlans = p
                        .ProductGroupToMasterPlans.Select(mp => new MasterPlanDto
                        {
                            Id = mp.MasterPlan.Id,
                            Name = mp.MasterPlan.Name,
                        })
                        .ToList(),
                    Products = p
                        .ProductGroupToProducts.OrderBy(x => x.Order)
                        .Select(pgp => new ProductDto
                        {
                            Id = pgp.Product.Id,
                            Name = pgp.Product.Name,
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
                items = productGroups,
                counts = new
                {
                    visibilityCount = visibilityCount,
                    masterPlanCount = masterPlanCount,
                    productCount = productCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetProductGroup(int id)
        {
            var lang = await GetLangAsync();
            var productGroup = await _context
                .ProductGroups.Include(p => p.ProductGroupToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductGroupToProducts)
                .ThenInclude(pgp => pgp.Product)
                .Include(p => p.ProductGroupFieldValues)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (productGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("ProductGroup/NotFound", lang) });
            }

            var result = new ProductGroupDto
            {
                Id = productGroup.Id,
                Name = productGroup.Name,
                MasterPlans = productGroup
                    .ProductGroupToMasterPlans.Select(pst => pst.MasterPlan)
                    .Select(mp => new MasterPlanDto { Id = mp.Id, Name = mp.Name })
                    .ToList(),
                Products = productGroup
                    .ProductGroupToProducts.OrderBy(x => x.Order)
                    .Select(x => new ProductDto { Id = x.Product.Id, Name = x.Product.Name })
                    .ToList(),
                IsHidden = productGroup.IsHidden,
                ProductGroupFieldValues = productGroup
                    .ProductGroupFieldValues.OrderBy(x => x.ProductId)
                    .ThenBy(x => x.MasterPlanFieldId)
                    .Select(x => new ProductGroupFieldValueDto
                    {
                        ProductId = x.ProductId,
                        MasterPlanFieldId = x.MasterPlanFieldId,
                        Value = x.Value ?? "",
                    })
                    .ToList(),
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProductGroup(int id)
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
            var productGroup = await _context
                .ProductGroups.Include(p => p.ProductGroupToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(p => p.ProductGroupToProducts)
                .ThenInclude(pgp => pgp.Product)
                .Include(p => p.ProductGroupFieldValues)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (productGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("ProductGroup/NotFound", lang) });
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "ProductGroup",
                productGroup.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = productGroup.Id,
                    ["Name"] = productGroup.Name,
                    ["MasterPlans"] = productGroup
                        .ProductGroupToMasterPlans.Select(p => p.MasterPlanId)
                        .ToList(),
                    ["Products"] = productGroup
                        .ProductGroupToProducts.Select(p => p.ProductId)
                        .ToList(),
                    ["IsHidden"] = productGroup.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            _context.ProductGroups.Remove(productGroup);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("ProductGroup/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProductGroup(CreateProductGroupDto dto)
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

            var existingProductGroup = await _context.ProductGroups.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingProductGroup != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("ProductGroup/NameTaken", lang) }
                );
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var mpIds = dto.MasterPlanIds ?? Array.Empty<int>();
            var pIds = dto.ProductIds ?? Array.Empty<int>();

            var requiredFieldIds = await GetRequiredFieldIdsByProductsAsync(pIds);

            if (mpIds.Length > 0 && requiredFieldIds.Length > 0)
            {
                var missing = await GetMissingFieldsByMasterPlanAsync(mpIds, requiredFieldIds);

                if (missing.Any())
                {
                    var mpNames = await _context
                        .MasterPlans.Where(x => missing.Keys.Contains(x.Id))
                        .Select(x => new { x.Id, x.Name })
                        .ToDictionaryAsync(x => x.Id, x => x.Name);

                    var fieldNames = await _context
                        .MasterPlanFields.Where(x => requiredFieldIds.Contains(x.Id))
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

            var productGroup = new ProductGroup
            {
                Name = dto.Name,
                ProductGroupToMasterPlans = (dto.MasterPlanIds ?? Array.Empty<int>())
                    .Select(mpId => new ProductGroupToMasterPlan { MasterPlanId = mpId })
                    .ToList(),
                ProductGroupToProducts = (dto.ProductIds ?? Array.Empty<int>())
                    .Select(
                        (productId, index) =>
                            new ProductGroupToProduct { ProductId = productId, Order = index }
                    )
                    .ToList(),
                IsHidden = dto.IsHidden,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            productGroup.ProductGroupFieldValues = (
                dto.ProductGroupFieldValues ?? new List<ProductGroupFieldValueDto>()
            )
                .Select(x => new ProductGroupFieldValue
                {
                    ProductId = x.ProductId,
                    MasterPlanFieldId = x.MasterPlanFieldId,
                    Value = x.Value ?? "",
                })
                .DistinctBy(x => new { x.ProductId, x.MasterPlanFieldId })
                .ToList();

            _context.ProductGroups.Add(productGroup);
            await _context.SaveChangesAsync();

            var result = new ProductGroupDto
            {
                Id = productGroup.Id,
                Name = productGroup.Name,
                MasterPlans = new List<MasterPlanDto>(),
                Products = new List<ProductDto>(),

                // Meta data.
                CreationDate = productGroup.CreationDate,
                CreatedBy = productGroup.CreatedBy,
                UpdateDate = productGroup.UpdateDate,
                UpdatedBy = productGroup.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "ProductGroup",
                productGroup.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = productGroup.Id,
                    ["Name"] = productGroup.Name,
                    ["MasterPlans"] = dto.MasterPlanIds,
                    ["Products"] = dto.ProductIds,
                    ["IsHidden"] = dto.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProductGroup(int id, UpdateProductGroupDto dto)
        {
            var lang = await GetLangAsync();
            var productGroup = await _context
                .ProductGroups.Include(pg => pg.ProductGroupToMasterPlans)
                .ThenInclude(mp => mp.MasterPlan)
                .Include(pg => pg.ProductGroupToProducts)
                .ThenInclude(p => p.Product)
                .Include(pg => pg.ProductGroupFieldValues)
                .FirstOrDefaultAsync(pg => pg.Id == id);

            if (productGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("ProductGroup/NotFound", lang) });
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

            var existingProductGroup = await _context.ProductGroups.FirstOrDefaultAsync(pg =>
                pg.Name.ToLower() == dto.Name.ToLower() && pg.Id != id
            );

            if (existingProductGroup != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("ProductGroup/NameTaken", lang) }
                );
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var mpIds = dto.MasterPlanIds ?? Array.Empty<int>();
            var pIds = dto.ProductIds ?? Array.Empty<int>();

            var requiredFieldIds = await GetRequiredFieldIdsByProductsAsync(pIds);

            if (mpIds.Length > 0 && requiredFieldIds.Length > 0)
            {
                var missing = await GetMissingFieldsByMasterPlanAsync(mpIds, requiredFieldIds);

                if (missing.Any())
                {
                    var mpNames = await _context
                        .MasterPlans.Where(x => missing.Keys.Contains(x.Id))
                        .Select(x => new { x.Id, x.Name })
                        .ToDictionaryAsync(x => x.Id, x => x.Name);

                    var fieldNames = await _context
                        .MasterPlanFields.Where(x => requiredFieldIds.Contains(x.Id))
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

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = productGroup.Id,
                ["Name"] = productGroup.Name,
                ["MasterPlans"] = productGroup
                    .ProductGroupToMasterPlans.Select(p => p.MasterPlanId)
                    .ToList(),
                ["Products"] = productGroup
                    .ProductGroupToProducts.Select(p => p.ProductId)
                    .ToList(),
                ["IsHidden"] = productGroup.IsHidden
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
            };

            productGroup.Name = dto.Name;
            productGroup.ProductGroupToMasterPlans = (dto.MasterPlanIds ?? Array.Empty<int>())
                .Select(mpId => new ProductGroupToMasterPlan { MasterPlanId = mpId })
                .ToList();

            var oldProductLinks = await _context
                .ProductGroupToProducts.Where(x => x.ProductGroupId == productGroup.Id)
                .ToListAsync();

            _context.ProductGroupToProducts.RemoveRange(oldProductLinks);

            var newProductLinks = (dto.ProductIds ?? Array.Empty<int>())
                .Select(
                    (productId, index) =>
                        new ProductGroupToProduct
                        {
                            ProductGroupId = productGroup.Id,
                            ProductId = productId,
                            Order = index,
                        }
                )
                .ToList();

            _context.ProductGroupToProducts.AddRange(newProductLinks);
            productGroup.ProductGroupToProducts = newProductLinks;

            productGroup.IsHidden = dto.IsHidden;

            productGroup.ProductGroupFieldValues = (
                dto.ProductGroupFieldValues ?? new List<ProductGroupFieldValueDto>()
            )
                .Select(x => new ProductGroupFieldValue
                {
                    ProductId = x.ProductId,
                    MasterPlanFieldId = x.MasterPlanFieldId,
                    Value = x.Value ?? "",
                })
                .DistinctBy(x => new { x.ProductId, x.MasterPlanFieldId })
                .ToList();

            // Meta data.
            productGroup.UpdateDate = now;
            productGroup.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var masterPlanIds = productGroup
                .ProductGroupToMasterPlans.Select(x => x.MasterPlanId)
                .ToList();

            var productIds = productGroup.ProductGroupToProducts.Select(x => x.ProductId).ToList();

            var masterPlans = await _context
                .MasterPlans.Where(mp => masterPlanIds.Contains(mp.Id))
                .Select(mp => new MasterPlanDto { Id = mp.Id, Name = mp.Name })
                .ToListAsync();

            var productsList = await _context
                .Products.Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            var products = productsList
                .OrderBy(p => productIds.IndexOf(p.Id))
                .Select(p => new ProductDto { Id = p.Id, Name = p.Name })
                .ToList();

            var result = new ProductGroupDto
            {
                Id = productGroup.Id,
                Name = productGroup.Name,
                MasterPlans = masterPlans,
                Products = products,
                IsHidden = productGroup.IsHidden,

                // Meta data.
                UpdateDate = productGroup.UpdateDate,
                UpdatedBy = productGroup.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "ProductGroup",
                productGroup.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = productGroup.Id,
                        ["Name"] = productGroup.Name,
                        ["MasterPlans"] = dto.MasterPlanIds,
                        ["Products"] = dto.ProductIds,
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

        [HttpGet("required-fields-by-product")]
        public async Task<IActionResult> GetRequiredFieldsByProduct([FromQuery] int[] productIds)
        {
            if (productIds == null || productIds.Length == 0)
            {
                return Ok(
                    new
                    {
                        byProduct = new Dictionary<int, int[]>(),
                        unionFieldIds = Array.Empty<int>(),
                    }
                );
            }

            var rows = await _context
                .ProductFieldValues.Where(x => productIds.Contains(x.ProductId))
                .Select(x => new { x.ProductId, x.MasterPlanFieldId })
                .ToListAsync();

            var byProduct = rows.GroupBy(x => x.ProductId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.MasterPlanFieldId).Distinct().OrderBy(x => x).ToArray()
                );

            var unionFieldIds = rows.Select(x => x.MasterPlanFieldId)
                .Distinct()
                .OrderBy(x => x)
                .ToArray();

            return Ok(new { byProduct, unionFieldIds });
        }

        private async Task<int[]> GetRequiredFieldIdsByProductsAsync(int[] productIds)
        {
            if (productIds == null || productIds.Length == 0)
                return Array.Empty<int>();

            return await _context
                .ProductFieldValues.Where(x => productIds.Contains(x.ProductId))
                .Select(x => x.MasterPlanFieldId)
                .Distinct()
                .ToArrayAsync();
        }
    }
}
