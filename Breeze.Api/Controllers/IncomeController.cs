using Breeze.Api.RequestResponseObjects.Incomes;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/budgets/{budgetId}/incomes")]
    public class IncomeController : ControllerBase
    {
        private readonly IncomeService incomes;
        private readonly ILogger<IncomeController> _logger;

        public IncomeController(IConfiguration config, ILogger<IncomeController> logger, BreezeContext breezeContext)
        {
            incomes = new IncomeService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{id}")]
        public IActionResult GetIncome([FromRoute] int id)
        {
            try
            {
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                return Ok(incomes.GetIncomeById("userId", id));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to get Income, error code: {ex.Message}");
                return BadRequest(ex.Message);
            }
        }


        [HttpGet]
        public IActionResult GetIncomes([FromRoute] int budgetId)
        {
            try
            {
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                return Ok(incomes.GetIncomeByBudgetId("userId", budgetId));
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
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                return Ok(incomes.CreateIncome("userId", incomeRequest));
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
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                return Ok(incomes.UpdateIncome("userId", incomeRequest));
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
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                return Ok(incomes.DeleteIncomeById("userId", id));
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
