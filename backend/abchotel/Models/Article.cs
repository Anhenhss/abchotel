using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Index("Slug", Name = "UQ__Articles__32DD1E4CCD018D3C", IsUnique = true)]
public partial class Article
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("category_id")]
    public int? CategoryId { get; set; }

    [Column("author_id")]
    public int? AuthorId { get; set; }

    [Column("title")]
    public string Title { get; set; } = null!;

    [Column("slug")]
    [StringLength(255)]
    public string? Slug { get; set; }

    [Column("content")]
    public string? Content { get; set; }

    [Column("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }

    [Column("published_at", TypeName = "datetime")]
    public DateTime? PublishedAt { get; set; }

    [Column("short_description")]
    [StringLength(500)]
    public string? ShortDescription { get; set; }

    [Column("meta_title")]
    [StringLength(255)]
    public string? MetaTitle { get; set; }

    [Column("meta_description")]
    [StringLength(500)]
    public string? MetaDescription { get; set; }

    [Column("view_count")]
    public int ViewCount { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    [ForeignKey("AuthorId")]
    [InverseProperty("Articles")]
    public virtual User? Author { get; set; }

    [ForeignKey("CategoryId")]
    [InverseProperty("Articles")]
    public virtual ArticleCategory? Category { get; set; }
}
