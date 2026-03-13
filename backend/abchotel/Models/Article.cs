using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class Article
{
    public int Id { get; set; }

    public int? CategoryId { get; set; }

    public int? AuthorId { get; set; }

    public string Title { get; set; } = null!;

    public string? Slug { get; set; }

    public string? Content { get; set; }

    public string? ThumbnailUrl { get; set; }

    public DateTime? PublishedAt { get; set; }

    public virtual User? Author { get; set; }

    public virtual ArticleCategory? Category { get; set; }
}
