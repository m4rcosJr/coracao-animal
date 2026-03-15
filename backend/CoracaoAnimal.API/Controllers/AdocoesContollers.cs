using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
    /// <summary>
    /// Controller responsavel pelos endpoints de Adocoes
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AdocoesController : ControllerBase
    {
        // Conexao com o banco de dados
        private readonly AppDbContext _context;

        // Construtor recebe o banco por injecao de dependencia
        public AdocoesController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/adocoes
        // Retorna todas as adocoes com dados do animal e adotante
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Adocao>>> GetAdocoes()
        {
            // Include traz os dados relacionados junto
            // sem Include traria so os IDs, sem os objetos completos
            return await _context.Adocoes
                .Include(a => a.Animal)    // traz os dados do animal
                .Include(a => a.Adotante)  // traz os dados do adotante
                .ToListAsync();
        }

        // GET api/adocoes/1
        // Retorna uma adocao pelo ID com dados completos
        [HttpGet("{id}")]
        public async Task<ActionResult<Adocao>> GetAdocao(int id)
        {
            var adocao = await _context.Adocoes
                .Include(a => a.Animal)
                .Include(a => a.Adotante)
                .FirstOrDefaultAsync(a => a.IdAdocao == id);

            if (adocao == null)
                return NotFound();

            return adocao;
        }

        // POST api/adocoes
        // Registra uma nova adocao
        [HttpPost]
        public async Task<ActionResult<Adocao>> PostAdocao(Adocao adocao)
        {
            _context.Adocoes.Add(adocao);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetAdocao),
                new { id = adocao.IdAdocao },
                adocao
            );
        }

        // PUT api/adocoes/1
        // Atualiza o status de uma adocao
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAdocao(int id, Adocao adocao)
        {
            if (id != adocao.IdAdocao)
                return BadRequest();

            _context.Entry(adocao).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE api/adocoes/1
        // Remove uma adocao pelo ID
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdocao(int id)
        {
            var adocao = await _context.Adocoes.FindAsync(id);

            if (adocao == null)
                return NotFound();

            _context.Adocoes.Remove(adocao);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}