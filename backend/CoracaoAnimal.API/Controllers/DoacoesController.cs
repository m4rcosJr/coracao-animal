using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
    /// <summary>
    /// Controller responsável pelos endpoints de Doações
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DoacoesController : ControllerBase
    {
        // Conexão com o banco de dados
        private readonly AppDbContext _context;

        // Construtor recebe o banco por injeção de dependência
        public DoacoesController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/doações
        // Retorna todas as doações com dados do adotante quando houver
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Doacao>>> GetDoacoes()
        {
            // Include traz os dados do adotante quando a doação não for anônima
            return await _context.Doacoes
                .Include(d => d.Adotante)
                .ToListAsync();
        }

        // GET api/doações/1
        // Retorna uma doação pelo ID
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

        // POST api/doações
        // Registra uma nova doação
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

        // PUT api/doações/1
        // Atualiza o status de uma doação
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDoacao(int id, Doacao doacao)
        {
            if (id != doacao.IdDoacao)
                return BadRequest();

            _context.Entry(doacao).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE api/doações/1
        // Remove uma doação pelo ID
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