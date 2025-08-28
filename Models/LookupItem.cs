namespace MillenniumERP.Models
{
    public class LookupItem
    {
        public int Id { get; set; }
        public string Code { get; set; } = "";
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class CustomerStatusItem : LookupItem
    {
        public bool RequiresApproval { get; set; } = false;
        public string[] AllowedRoles { get; set; } = Array.Empty<string>();
    }
}