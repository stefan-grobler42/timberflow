namespace MillenniumERP.Application.DTOs;

public class DuplicateMatchRule
{
    public required string FieldName { get; set; }
    public required string MatchType { get; set; }
    public int Weight { get; set; } = 1;
}

public class DuplicateDetectionRequest
{
    public required string EntityType { get; set; }
    public required List<DuplicateMatchRule> MatchRules { get; set; }
    public int MinimumScore { get; set; } = 60;
}

public class DuplicateRecordInfo
{
    public required string Id { get; set; }
    public required Dictionary<string, object?> Fields { get; set; }
    public int MatchScore { get; set; }
}

public class DuplicateGroup
{
    public required DuplicateRecordInfo MasterRecord { get; set; }
    public required List<DuplicateRecordInfo> DuplicateRecords { get; set; }
    public int TotalRecords => 1 + DuplicateRecords.Count;
}

public class DuplicateDetectionResponse
{
    public required List<DuplicateGroup> DuplicateGroups { get; set; }
    public int TotalDuplicates { get; set; }
}

public class DuplicateMergeRequest
{
    public required string EntityType { get; set; }
    public required string MasterRecordId { get; set; }
    public required List<string> DuplicateRecordIds { get; set; }
    public required Dictionary<string, string> FieldSelections { get; set; }
}

public class DuplicateMergeResponse
{
    public required string MergedRecordId { get; set; }
    public int DeletedRecordCount { get; set; }
    public int RelinkedRecordCount { get; set; }
    public required List<string> Messages { get; set; }
}
