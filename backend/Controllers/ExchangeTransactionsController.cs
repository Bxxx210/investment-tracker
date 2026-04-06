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
    public ActionResult<IEnumerable<ExchangeTransaction>> GetAll()
    {
        try
        {
            return Ok(_service.GetAll());
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public ActionResult<ExchangeTransaction> GetById(int id)
    {
        try
        {
            var transaction = _service.GetById(id);
            return transaction is null ? NotFound(new { message = "ไม่พบรายการแลกเปลี่ยน" }) : Ok(transaction);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถดึงข้อมูลรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpPost]
    public ActionResult<ExchangeTransaction> Create([FromBody] ExchangeTransaction transaction)
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
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถสร้างรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public ActionResult<ExchangeTransaction> Update(int id, [FromBody] ExchangeTransaction transaction)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = _service.Update(id, transaction);
            return updated is null ? NotFound(new { message = "ไม่พบรายการแลกเปลี่ยน" }) : Ok(updated);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถแก้ไขรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        try
        {
            return _service.Delete(id) ? NoContent() : NotFound(new { message = "ไม่พบรายการแลกเปลี่ยน" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ไม่สามารถลบรายการแลกเปลี่ยนได้", detail = ex.Message });
        }
    }
}
