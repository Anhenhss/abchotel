namespace abchotel.DTOs
{
    public class AttractionResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal? DistanceKm { get; set; }
        public string Description { get; set; }
        public string MapEmbedLink { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string Address { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateAttractionRequest
    {
        public string Name { get; set; }
        public decimal? DistanceKm { get; set; }
        public string Description { get; set; }
        public string MapEmbedLink { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string Address { get; set; }
    }

    public class UpdateAttractionRequest
    {
        public string Name { get; set; }
        public decimal? DistanceKm { get; set; }
        public string Description { get; set; }
        public string MapEmbedLink { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string Address { get; set; }
    }
}