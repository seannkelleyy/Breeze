using Breeze.Api.Budgets;
using Breeze.Api.Incomes.RequestResponseObjects;
using Breeze.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;

namespace Breeze.Api.Incomes
{
    [Authorize]
    [ApiController]
    [Route("/budgets/{budgetId}/incomes")]
    public class IncomeController : ControllerBase
    {
        private readonly BudgetService budgets;
        private readonly IncomeService incomes;
        private readonly ILogger<IncomeController> _logger;

        public IncomeController(IConfiguration config, ILogger<IncomeController> logger, BreezeContext breezeContext)
        {
            budgets = new BudgetService(config, breezeContext, logger);
            incomes = new IncomeService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetIncomes([FromRoute] int budgetId)
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(incomes.GetIncomesByBudgetId(userId, budgetId));
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
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = incomes.CreateIncome(userId, incomeRequest);
                var incomeList = incomes.GetIncomesByBudgetId(userId, incomeRequest.BudgetId);
                if (incomeList != null)
                {
                    budgets.CalculateBudgetIncomes(userId, incomeRequest.BudgetId, incomeList);
                }
                else
                {
                    _logger.LogError("Income list is null");
                    return BadRequest("Income list is null");
                }
                return Ok(response);
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
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = incomes.UpdateIncome(userId, incomeRequest);
                var incomeList = incomes.GetIncomesByBudgetId(userId, incomeRequest.BudgetId);
                if (incomeList != null)
                {
                    budgets.CalculateBudgetIncomes(userId, incomeRequest.BudgetId, incomeList);
                }
                else
                {
                    _logger.LogError("Income list is null");
                    return BadRequest("Income list is null");
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteIncome([FromRoute] int id)
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var income = incomes.GetIncomeById(userId, id);
                if (income == null)
                {
                    _logger.LogError("Income not found");
                    return NotFound("Income not found");
                }
                int budgetId = income.BudgetId;
                var response = incomes.DeleteIncomeById(userId, id);
                var incomeList = incomes.GetIncomesByBudgetId(userId, budgetId);
                if (incomeList != null)
                {
                    budgets.CalculateBudgetIncomes(userId, budgetId, incomeList);
                }
                else
                {
                    _logger.LogError("Income list is null");
                    return BadRequest("Income list is null");
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
