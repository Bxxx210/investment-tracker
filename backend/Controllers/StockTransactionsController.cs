using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StockTransactionsController : ControllerBase
{
    private readonly IStockTransactionService _service;

    public StockTransactionsController(IStockTransactionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockTransaction>>> GetAll()
    {
        try
        {
            return Ok(await _service.GetAllAsync());
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StockTransaction>> GetById(int id)
    {
        try
        {
            var transaction = await _service.GetByIdAsync(id);
            return transaction is null ? NotFound(new { message = "ไม่พบรายการหุ้น" }) : Ok(transaction);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<StockTransaction>> Create([FromBody] StockTransaction transaction)
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
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถสร้างรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<StockTransaction>> Update(int id, [FromBody] StockTransaction transaction)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = await _service.UpdateAsync(id, transaction);
            return updated is null ? NotFound(new { message = "ไม่พบรายการหุ้น" }) : Ok(updated);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถแก้ไขรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            return await _service.DeleteAsync(id) ? NoContent() : NotFound(new { message = "ไม่พบรายการหุ้น" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถลบรายการหุ้นได้", detail = ex.Message });
        }
    }
}
