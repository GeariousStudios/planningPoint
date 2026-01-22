using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Dtos.Product
{
    public class ProductGroupFieldValueDto
    {
        public int MasterPlanFieldId { get; set; }
        public string? Value { get; set; }
    }
}
