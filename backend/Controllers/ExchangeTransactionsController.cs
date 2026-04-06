using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExchangeTransactionsController : ControllerBase
{
    private readonly IExchangeTransactionService _service;

    public ExchangeTransactionsController(IExchangeTransactionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExchangeTransaction>>> GetAll()
    {
        try
        {
            return Ok(await _service.GetAllAsync());
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ExchangeTransaction>> GetById(int id)
    {
        try
        {
            var transaction = await _service.GetByIdAsync(id);
            return transaction is null ? NotFound(new { message = "ไม่พบรายการแลกเปลี่ยน" }) : Ok(transaction);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ExchangeTransaction>> Create([FromBody] ExchangeTransaction transaction)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = await _service.CreateAsync(transaction);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถสร้างรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ExchangeTransaction>> Update(int id, [FromBody] ExchangeTransaction transaction)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = await _service.UpdateAsync(id, transaction);
            return updated is null ? NotFound(new { message = "ไม่พบรายการแลกเปลี่ยน" }) : Ok(updated);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถแก้ไขรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            return await _service.DeleteAsync(id) ? NoContent() : NotFound(new { message = "ไม่พบรายการแลกเปลี่ยน" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถลบรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }
}
