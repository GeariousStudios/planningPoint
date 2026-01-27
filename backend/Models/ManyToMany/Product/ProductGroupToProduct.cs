namespace backend.Models.ManyToMany
{
    public class ProductGroupToProduct
    {
        public int ProductGroupId { get; set; }
        public ProductGroup ProductGroup { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public bool IsActive { get; set; }
        public int Order { get; set; }
    }
}
