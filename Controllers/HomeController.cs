using Microsoft.AspNetCore.Mvc;

namespace MillenniumERP.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            // Return the SPA home page
            return View();
        }
    }
}