using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TaxSummariesController : ControllerBase
{
    private readonly ITaxSummaryService _service;

    public TaxSummariesController(ITaxSummaryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaxSummary>>> GetAll()
    {
        try
        {
            return Ok(await _service.GetAllAsync());
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaxSummary>> GetById(int id)
    {
        try
        {
            var summary = await _service.GetByIdAsync(id);
            return summary is null ? NotFound(new { message = "ไม่พบสรุปภาษี" }) : Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TaxSummary>> Create([FromBody] TaxSummary summary)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = await _service.CreateAsync(summary);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถสร้างสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaxSummary>> Update(int id, [FromBody] TaxSummary summary)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = await _service.UpdateAsync(id, summary);
            return updated is null ? NotFound(new { message = "ไม่พบสรุปภาษี" }) : Ok(updated);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถแก้ไขสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            return await _service.DeleteAsync(id) ? NoContent() : NotFound(new { message = "ไม่พบสรุปภาษี" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถลบสรุปภาษีได้", detail = ex.Message });
        }
    }
}
