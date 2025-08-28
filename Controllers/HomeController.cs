using Microsoft.AspNetCore.Mvc;

namespace MillenniumERP.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            // Redirect to Customer module by default
            return RedirectToAction("Index", "Customer");
        }
    }
}