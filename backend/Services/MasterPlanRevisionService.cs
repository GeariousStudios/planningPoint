using System.Text.Json;
using backend.Data;
using backend.Dtos.MasterPlan;
using backend.Dtos.Unit;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class MasterPlanRevisionService
    {
        private readonly AppDbContext _context;

        public MasterPlanRevisionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MasterPlanRevision?> ArchiveAsync(int masterPlanId, string archivedBy)
        {
            var mp = await _context
                .MasterPlans.AsNoTracking()
                .AsSplitQuery()
                .Include(x => x.UnitGroup)
                .Include(x => x.MasterPlanToMasterPlanFields)
                .ThenInclude(x => x.MasterPlanField)
                .Include(x => x.MasterPlanToMasterPlanElements)
                .ThenInclude(x => x.MasterPlanElement)
                .ThenInclude(x => x.Values)
                .ThenInclude(x => x.MasterPlanField)
                .FirstOrDefaultAsync(x => x.Id == masterPlanId);

            if (mp == null)
                return null;

            var nextRevisionNumber =
                (
                    await _context
                        .MasterPlanRevisions.AsNoTracking()
                        .Where(r => r.MasterPlanId == masterPlanId)
                        .MaxAsync(r => (int?)r.RevisionNumber)
                ) ?? 0;

            nextRevisionNumber += 1;

            var units = await _context
                .Units.AsNoTracking()
                .Where(u => u.MasterPlanId == mp.Id)
                .Select(u => new UnitDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    UnitGroupName = u.UnitGroup != null ? u.UnitGroup.Name : "",
                })
                .ToListAsync();

            var fieldsOrdered = mp
                .MasterPlanToMasterPlanFields.OrderBy(x => x.Order)
                .Select(x => x.MasterPlanField)
                .ToList();

            var elementsOrdered = mp
                .MasterPlanToMasterPlanElements.OrderBy(x => x.Order)
                .Select(x => x.MasterPlanElement)
                .ToList();

            var dto = new MasterPlanDto
            {
                Id = mp.Id,
                Name = mp.Name,
                UnitGroupId = mp.UnitGroupId,
                UnitGroupName = mp.UnitGroup?.Name ?? "",
                Units = units,
                IsHidden = mp.IsHidden,
                AllowRemovingElements = mp.AllowRemovingElements,
                AllowImport = mp.AllowImport,
                ReplaceOnImport = mp.ReplaceOnImport,
                Fields = fieldsOrdered
                    .Select(f => new MasterPlanFieldDto
                    {
                        Id = f.Id,
                        Name = f.Name,
                        DataType = f.DataType,
                        Alignment = f.Alignment,
                        IsHidden = f.IsHidden,
                    })
                    .ToList(),
                Elements = elementsOrdered
                    .Select(e =>
                    {
                        var valueMap = (
                            e.Values ?? new List<backend.Models.MasterPlanElementValue>()
                        )
                            .GroupBy(v => v.MasterPlanFieldId)
                            .ToDictionary(g => g.Key, g => g.Select(x => x.Value).FirstOrDefault());

                        return new MasterPlanElementDto
                        {
                            Id = e.Id,
                            Status = e.Status,
                            GroupId = e.GroupId,
                            StruckElement = e.StruckElement,
                            CurrentElement = e.CurrentElement,
                            NextElement = e.NextElement,
                            Values = fieldsOrdered
                                .Select(f => new MasterPlanElementValueDto
                                {
                                    MasterPlanFieldId = f.Id,
                                    MasterPlanFieldName = f.Name,
                                    Value = valueMap.TryGetValue(f.Id, out var val) ? val : null,
                                })
                                .ToList(),
                        };
                    })
                    .ToList(),
                GroupFieldId = mp
                    .MasterPlanToMasterPlanFields.Where(x => x.IsGroupKey)
                    .Select(x => (int?)x.MasterPlanFieldId)
                    .FirstOrDefault(),
                CreationDate = mp.CreationDate,
                CreatedBy = mp.CreatedBy,
                UpdateDate = mp.UpdateDate,
                UpdatedBy = mp.UpdatedBy,
                IsCheckedOut = mp.IsCheckedOut,
                CheckedOutBy = mp.CheckedOutBy,
                CheckedOutAt = mp.CheckedOutAt,
            };

            var snapshotJson = JsonSerializer.Serialize(dto);

            var revision = new MasterPlanRevision
            {
                MasterPlanId = mp.Id,
                RevisionNumber = nextRevisionNumber,
                ArchivedAt = DateTime.UtcNow,
                ArchivedBy = archivedBy,
                Name = mp.Name,
                SnapshotJson = snapshotJson,
            };

            _context.MasterPlanRevisions.Add(revision);
            await _context.SaveChangesAsync();

            return revision;
        }

        public async Task<MasterPlanRevision?> ArchiveOncePerCheckoutAsync(
            int masterPlanId,
            string archivedBy
        )
        {
            var plan = await _context.MasterPlans.FirstOrDefaultAsync(x => x.Id == masterPlanId);
            if (plan == null)
                return null;

            if (plan.IsCheckedOut && plan.CheckedOutAt.HasValue)
            {
                if (
                    plan.RevisionArchivedForCheckoutAt.HasValue
                    && plan.RevisionArchivedForCheckoutAt.Value == plan.CheckedOutAt.Value
                )
                {
                    return null;
                }
            }

            var revision = await ArchiveAsync(masterPlanId, archivedBy);

            if (revision != null && plan.IsCheckedOut && plan.CheckedOutAt.HasValue)
            {
                plan.RevisionArchivedForCheckoutAt = plan.CheckedOutAt.Value;
                await _context.SaveChangesAsync();
            }

            return revision;
        }
    }
}
