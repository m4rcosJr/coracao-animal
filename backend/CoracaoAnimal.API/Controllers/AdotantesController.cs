using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
	/// <summary>
	/// Controller responsavel pelos endpoints de Adotantes
	/// </summary>
	[ApiController]
	[Route("api/[controller]")]
	public class AdotantesController : ControllerBase
	{
		// Conexao com o banco de dados
		private readonly AppDbContext _context;

		// Construtor recebe o banco por injecao de dependencia
		public AdotantesController(AppDbContext context)
		{
			_context = context;
		}

		// GET api/adotantes
		// Retorna todos os adotantes cadastrados
		[HttpGet]
		public async Task<ActionResult<IEnumerable<Adotante>>> GetAdotantes()
		{
			return await _context.Adotantes.ToListAsync();
		}

		// GET api/adotantes/1
		// Retorna um adotante pelo ID
		[HttpGet("{id}")]
		public async Task<ActionResult<Adotante>> GetAdotante(int id)
		{
			var adotante = await _context.Adotantes.FindAsync(id);

			if (adotante == null)
				return NotFound();

			return adotante;
		}

		// POST api/adotantes
		// Cadastra um novo adotante
		[HttpPost]
		public async Task<ActionResult<Adotante>> PostAdotante(Adotante adotante)
		{
			_context.Adotantes.Add(adotante);
			await _context.SaveChangesAsync();

			return CreatedAtAction(
				nameof(GetAdotante),
				new { id = adotante.IdAdotante },
				adotante
			);
		}

		// PUT api/adotantes/1
		// Atualiza os dados de um adotante
		[HttpPut("{id}")]
		public async Task<IActionResult> PutAdotante(int id, Adotante adotante)
		{
			if (id != adotante.IdAdotante)
				return BadRequest();

			_context.Entry(adotante).State = EntityState.Modified;
			await _context.SaveChangesAsync();

			return NoContent();
		}

		// DELETE api/adotantes/1
		// Remove um adotante pelo ID
		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteAdotante(int id)
		{
			var adotante = await _context.Adotantes.FindAsync(id);

			if (adotante == null)
				return NotFound();

			_context.Adotantes.Remove(adotante);
			await _context.SaveChangesAsync();

			return NoContent();
		}
	}
}
