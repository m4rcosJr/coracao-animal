using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
    /// <summary>
    /// Controller responsavel pelos endpoints de Doacoes
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DoacoesController : ControllerBase
    {
        // Conexao com o banco de dados
        private readonly AppDbContext _context;

        // Construtor recebe o banco por injecao de dependencia
        public DoacoesController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/doacoes
        // Retorna todas as doacoes com dados do adotante quando houver
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Doacao>>> GetDoacoes()
        {
            // Include traz os dados do adotante quando a doacao nao for anonima
            return await _context.Doacoes
                .Include(d => d.Adotante)
                .ToListAsync();
        }

        // GET api/doacoes/1
        // Retorna uma doacao pelo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Doacao>> GetDoacao(int id)
        {
            var doacao = await _context.Doacoes
                .Include(d => d.Adotante)
                .FirstOrDefaultAsync(d => d.IdDoacao == id);

            if (doacao == null)
                return NotFound();

            return doacao;
        }

        // POST api/doacoes
        // Registra uma nova doacao
        [HttpPost]
        public async Task<ActionResult<Doacao>> PostDoacao(Doacao doacao)
        {
            _context.Doacoes.Add(doacao);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDoacao),
                new { id = doacao.IdDoacao },
                doacao
            );
        }

        // PUT api/doacoes/1
        // Atualiza o status de uma doacao
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDoacao(int id, Doacao doacao)
        {
            if (id != doacao.IdDoacao)
                return BadRequest();

            _context.Entry(doacao).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE api/doacoes/1
        // Remove uma doacao pelo ID
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDoacao(int id)
        {
            var doacao = await _context.Doacoes.FindAsync(id);

            if (doacao == null)
                return NotFound();

            _context.Doacoes.Remove(doacao);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}