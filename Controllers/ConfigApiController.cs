using Microsoft.AspNetCore.Mvc;

namespace MillenniumERP.Controllers
{
    [ApiController]
    [Route("api")]
    public class ConfigApiController : ControllerBase
    {
        [HttpGet("google-maps-key")]
        public IActionResult GetGoogleMapsKey()
        {
            var apiKey = Environment.GetEnvironmentVariable("GOOGLE_API_KEY");
            
            if (string.IsNullOrEmpty(apiKey))
            {
                return Ok(new { apiKey = "DEVELOPMENT_KEY_NOT_SET" });
            }
            
            return Ok(new { apiKey = apiKey });
        }
    }
}