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
    public ActionResult<IEnumerable<TaxSummary>> GetAll()
    {
        try
        {
            return Ok(_service.GetAll());
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public ActionResult<TaxSummary> GetById(int id)
    {
        try
        {
            var summary = _service.GetById(id);
            return summary is null ? NotFound(new { message = "ไม่พบสรุปภาษี" }) : Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpPost]
    public ActionResult<TaxSummary> Create([FromBody] TaxSummary summary)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = _service.Create(summary);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถสร้างสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public ActionResult<TaxSummary> Update(int id, [FromBody] TaxSummary summary)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = _service.Update(id, summary);
            return updated is null ? NotFound(new { message = "ไม่พบสรุปภาษี" }) : Ok(updated);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถแก้ไขสรุปภาษีได้", detail = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        try
        {
            return _service.Delete(id) ? NoContent() : NotFound(new { message = "ไม่พบสรุปภาษี" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถลบสรุปภาษีได้", detail = ex.Message });
        }
    }
}
