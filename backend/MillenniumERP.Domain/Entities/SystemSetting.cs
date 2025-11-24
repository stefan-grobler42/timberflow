using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("system_settings")]
public class SystemSetting
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("setting_key")]
    [MaxLength(100)]
    [Required]
    public string SettingKey { get; set; } = string.Empty;

    [Column("setting_value")]
    public string? SettingValue { get; set; }

    [Column("category")]
    [MaxLength(50)]
    public string? Category { get; set; }

    [Column("description")]
    [MaxLength(500)]
    public string? Description { get; set; }

    [Column("created_on")]
    public DateTime? CreatedOn { get; set; }

    [Column("modified_on")]
    public DateTime? ModifiedOn { get; set; }
}
