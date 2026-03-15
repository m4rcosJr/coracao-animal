using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
    /// <summary>
    /// Controller responsavel pelos endpoints de Voluntarios
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class VoluntariosController : ControllerBase
    {
        // Conexao com o banco de dados
        private readonly AppDbContext _context;

        // Construtor recebe o banco por injecao de dependencia
        public VoluntariosController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/voluntarios
        // Retorna todos os voluntarios cadastrados
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Voluntario>>> GetVoluntarios()
        {
            return await _context.Voluntarios.ToListAsync();
        }

        // GET api/voluntarios/1
        // Retorna um voluntario pelo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Voluntario>> GetVoluntario(int id)
        {
            var voluntario = await _context.Voluntarios.FindAsync(id);

            if (voluntario == null)
                return NotFound();

            return voluntario;
        }

        // POST api/voluntarios
        // Cadastra um novo voluntario
        [HttpPost]
        public async Task<ActionResult<Voluntario>> PostVoluntario(Voluntario voluntario)
        {
            _context.Voluntarios.Add(voluntario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetVoluntario),
                new { id = voluntario.IdVoluntario },
                voluntario
            );
        }

        // PUT api/voluntarios/1
        // Atualiza os dados de um voluntario
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVoluntario(int id, Voluntario voluntario)
        {
            if (id != voluntario.IdVoluntario)
                return BadRequest();

            _context.Entry(voluntario).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE api/voluntarios/1
        // Remove um voluntario pelo ID
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVoluntario(int id)
        {
            var voluntario = await _context.Voluntarios.FindAsync(id);

            if (voluntario == null)
                return NotFound();

            _context.Voluntarios.Remove(voluntario);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
    