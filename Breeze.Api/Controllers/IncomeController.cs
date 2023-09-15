using Breeze.Api.RequestResponseObjects.Incomes;
using Breeze.Api.Services;
using Breeze.Data;
using Breeze.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Infrastructure;

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
        public IActionResult GetIncome(int BudgetId)
        {
            try
            {
                return Ok(incomes.GetIncomeByBudgetId(BudgetId));
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

        public async Task<IActionResult> PatchIncome(int id, [FromBody] IncomeRequest incomeRequest)
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

        [HttpDelete]
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

        [HttpDelete]
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
