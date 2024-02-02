using Breeze.Api.RequestResponseObjects.Incomes;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class IncomeController : ControllerBase
    {
        private readonly IncomeService incomes;
        private readonly ILogger<IncomeController> _logger;

        public IncomeController(IConfiguration config, ILogger<IncomeController> logger, BreezeContext breezeContext)
        {
            incomes = new IncomeService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetIncome(int budgetId)
        {
            try
            {
                return Ok(incomes.GetIncomeByBudgetId(budgetId));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to get Incomes, error code: {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public IActionResult PostIncome(IncomeRequest incomeRequest)
        {
            try
            {
                return Ok(incomes.CreateIncome(incomeRequest));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch]

        public IActionResult PatchIncome([FromBody] IncomeRequest incomeRequest)
        {
            try
            {
                return Ok(incomes.UpdateIncome(incomeRequest));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("id")]
        public IActionResult DeleteIncome(int id)
        {
            try
            {
                return Ok(incomes.DeleteIncome(id));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("income/{incomeId}")]
        public IActionResult DeleteIncomesForBudget(int budgetId)
        {
            try
            {
                incomes.DeleteIncomesForBudget(budgetId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
