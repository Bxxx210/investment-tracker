using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/investment")]
public class InvestmentSummaryController : ControllerBase
{
    private readonly IInvestmentSummaryService _service;

    public InvestmentSummaryController(IInvestmentSummaryService service)
    {
        _service = service;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<InvestmentSummaryResponse>> GetSummary([FromQuery] int? year = null)
    {
        try
        {
            return Ok(await _service.GetSummaryAsync(year));
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "ไม่สามารถคำนวณสรุปการลงทุนได้", detail = ex.Message });
        }
    }
}
