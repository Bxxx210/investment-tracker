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
    public ActionResult<IEnumerable<StockTransaction>> GetAll()
    {
        try
        {
            return Ok(_service.GetAll());
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public ActionResult<StockTransaction> GetById(int id)
    {
        try
        {
            var transaction = _service.GetById(id);
            return transaction is null ? NotFound(new { message = "ไม่พบรายการหุ้น" }) : Ok(transaction);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpPost]
    public ActionResult<StockTransaction> Create([FromBody] StockTransaction transaction)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = _service.Create(transaction);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถสร้างรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public ActionResult<StockTransaction> Update(int id, [FromBody] StockTransaction transaction)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = _service.Update(id, transaction);
            return updated is null ? NotFound(new { message = "ไม่พบรายการหุ้น" }) : Ok(updated);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถแก้ไขรายการหุ้นได้", detail = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        try
        {
            return _service.Delete(id) ? NoContent() : NotFound(new { message = "ไม่พบรายการหุ้น" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถลบรายการหุ้นได้", detail = ex.Message });
        }
    }
}
