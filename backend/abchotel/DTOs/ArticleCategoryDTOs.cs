namespace abchotel.DTOs
{
    public class CategoryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class UpdateCategoryRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }
}