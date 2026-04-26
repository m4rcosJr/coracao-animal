using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
    /// <summary>
    /// Controller responsável pelos endpoints de Voluntários
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class VoluntariosController : ControllerBase
    {
        // Conexão com o banco de dados
        private readonly AppDbContext _context;

        // Construtor recebe o banco por injeção de dependência
        public VoluntariosController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/voluntários
        // Retorna todos os voluntários cadastrados
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Voluntario>>> GetVoluntarios()
        {
            return await _context.Voluntarios.ToListAsync();
        }

        // GET api/voluntários/1
        // Retorna um voluntário pelo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Voluntario>> GetVoluntario(int id)
        {
            var voluntario = await _context.Voluntarios.FindAsync(id);

            if (voluntario == null)
                return NotFound();

            return voluntario;
        }

        // POST api/voluntários
        // Cadastra um novo voluntário
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

        // PUT api/voluntários/1
        // Atualiza os dados de um voluntário
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVoluntario(int id, Voluntario voluntario)
        {
            if (id != voluntario.IdVoluntario)
                return BadRequest();

            _context.Entry(voluntario).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE api/voluntários/1
        // Remove um voluntário pelo ID
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
    