namespace MillenniumERP.Application.DTOs;

public class ProductionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? Customer { get; set; }
    public Guid? Orderno { get; set; }
    public DateTime? Jigstart { get; set; }
    public DateTime? Jigend { get; set; }
    public Guid? Jigleader { get; set; }
    public Guid? Jighelper1 { get; set; }
    public Guid? Jighelper2 { get; set; }
    public Guid? Jighelper3 { get; set; }
    public Guid? Jighelper4 { get; set; }
    public DateTime? Pickstart { get; set; }
    public DateTime? Pickend { get; set; }
    public Guid? Pickingmaster { get; set; }
    public Guid? Pickinghelper1 { get; set; }
    public Guid? Pickinghelper2 { get; set; }
    public Guid? Pickinghelper3 { get; set; }
    public DateTime? Sawstart { get; set; }
    public DateTime? Sawend { get; set; }
    public Guid? Sawoperator { get; set; }
    public Guid? Sawhelper1 { get; set; }
    public Guid? Sawhelper2 { get; set; }
    public bool? Productioncomplete { get; set; }
    public DateTime? Productionplanneddate { get; set; }
    public int? Totalcuts { get; set; }
    public decimal? Totaltimbercubes { get; set; }
    public decimal? Trusscost { get; set; }
    public int? Trussselling { get; set; }
    public decimal? Workunitsefinks { get; set; }
    public decimal? NewEstimatedefinks { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateProductionDto
{
    public string Name { get; set; } = string.Empty;
    public Guid? Customer { get; set; }
    public Guid? Orderno { get; set; }
    public DateTime? Jigstart { get; set; }
    public DateTime? Jigend { get; set; }
    public Guid? Jigleader { get; set; }
    public Guid? Jighelper1 { get; set; }
    public Guid? Jighelper2 { get; set; }
    public Guid? Jighelper3 { get; set; }
    public Guid? Jighelper4 { get; set; }
    public DateTime? Pickstart { get; set; }
    public DateTime? Pickend { get; set; }
    public Guid? Pickingmaster { get; set; }
    public Guid? Pickinghelper1 { get; set; }
    public Guid? Pickinghelper2 { get; set; }
    public Guid? Pickinghelper3 { get; set; }
    public DateTime? Sawstart { get; set; }
    public DateTime? Sawend { get; set; }
    public Guid? Sawoperator { get; set; }
    public Guid? Sawhelper1 { get; set; }
    public Guid? Sawhelper2 { get; set; }
    public bool? Productioncomplete { get; set; }
    public DateTime? Productionplanneddate { get; set; }
    public int? Totalcuts { get; set; }
    public decimal? Totaltimbercubes { get; set; }
    public decimal? Trusscost { get; set; }
    public int? Trussselling { get; set; }
    public decimal? Workunitsefinks { get; set; }
    public decimal? NewEstimatedefinks { get; set; }
}

public class UpdateProductionDto
{
    public string? Name { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Orderno { get; set; }
    public DateTime? Jigstart { get; set; }
    public DateTime? Jigend { get; set; }
    public Guid? Jigleader { get; set; }
    public Guid? Jighelper1 { get; set; }
    public Guid? Jighelper2 { get; set; }
    public Guid? Jighelper3 { get; set; }
    public Guid? Jighelper4 { get; set; }
    public DateTime? Pickstart { get; set; }
    public DateTime? Pickend { get; set; }
    public Guid? Pickingmaster { get; set; }
    public Guid? Pickinghelper1 { get; set; }
    public Guid? Pickinghelper2 { get; set; }
    public Guid? Pickinghelper3 { get; set; }
    public DateTime? Sawstart { get; set; }
    public DateTime? Sawend { get; set; }
    public Guid? Sawoperator { get; set; }
    public Guid? Sawhelper1 { get; set; }
    public Guid? Sawhelper2 { get; set; }
    public bool? Productioncomplete { get; set; }
    public DateTime? Productionplanneddate { get; set; }
    public int? Totalcuts { get; set; }
    public decimal? Totaltimbercubes { get; set; }
    public decimal? Trusscost { get; set; }
    public int? Trussselling { get; set; }
    public decimal? Workunitsefinks { get; set; }
    public decimal? NewEstimatedefinks { get; set; }
}
