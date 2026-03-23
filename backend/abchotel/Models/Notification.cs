using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace abchotel.Models
{
    [Table("Notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int? UserId { get; set; }

        [Column("title")]
        public string Title { get; set; }

        [Column("content")]
        public string Content { get; set; }

        [Column("type")]
        public string Type { get; set; }

        [Column("reference_link")]
        public string ReferenceLink { get; set; }

        [Column("is_read")]
        public bool IsRead { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        // Khóa ngoại liên kết với bảng Users
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}