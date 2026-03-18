using System;

namespace abchotel.DTOs
{
    public class ArticleResponse
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Slug { get; set; }
        public string ThumbnailUrl { get; set; }
        public string CategoryName { get; set; }
        public string AuthorName { get; set; }
        public DateTime? PublishedAt { get; set; }
        public int ViewCount { get; set; }
        public bool IsActive { get; set; }
    }

    public class ArticleDetailResponse : ArticleResponse
    {
        public string Content { get; set; }
        public string ShortDescription { get; set; }
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
    }

    public class CreateArticleRequest
    {
        public int CategoryId { get; set; }
        // TUYỆT ĐỐI KHÔNG CÓ AuthorId Ở ĐÂY
        public string Title { get; set; }
        public string Content { get; set; }
        public string ShortDescription { get; set; }
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
    }

    public class UpdateArticleRequest
    {
        public int CategoryId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string ShortDescription { get; set; }
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
    }

    public class UpdateThumbnailRequest
    {
        public string ThumbnailUrl { get; set; }
    }
}