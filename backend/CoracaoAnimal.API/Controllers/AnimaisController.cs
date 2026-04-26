using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
    /// <summary>
    /// Controlador responsável pelos endpoints de Animais.
    /// Suporta upload de imagem via multipart/form-data.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AnimaisController : ControllerBase
    {
        // Conexão com o banco de dados
        private readonly AppDbContext _context;

        // Ambiente da aplicação — usado para obter o caminho físico do wwwroot
        private readonly IWebHostEnvironment _env;

        // Tipos de arquivo de imagem aceitos
        private static readonly string[] _tiposPermitidos = { "image/jpeg", "image/png", "image/webp", "image/gif" };

        // Tamanho máximo da imagem: 5MB
        private const long TAMANHO_MAXIMO = 5 * 1024 * 1024;

        // Construtor recebe o banco e o ambiente por injeção de dependência
        public AnimaisController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env     = env;
        }

        // ─────────────────────────────────────────────────────────────
        // GET api/animais
        // Retorna todos os animais cadastrados
        // ─────────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Animal>>> GetAnimais()
        {
            return await _context.Animais.ToListAsync();
        }

        // ─────────────────────────────────────────────────────────────
        // GET api/animais/1
        // Retorna um animal específico pelo ID
        // ─────────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<ActionResult<Animal>> GetAnimal(int id)
        {
            var animal = await _context.Animais.FindAsync(id);

            if (animal == null)
                return NotFound(new { mensagem = $"Animal com ID {id} nao encontrado" });

            return animal;
        }

        // ─────────────────────────────────────────────────────────────
        // POST api/animais
        //
        // ANTES (não suportava imagem):
        //   Recebia JSON simples: { "nome": "Rex", "fotoUrl": "http://..." }
        //
        // AGORA (suporta upload):
        //   Recebe multipart/form-data com campos de texto + arquivo
        //   O arquivo é salvo em wwwroot/uploads com nome único (GUID)
        //   O banco salva apenas o caminho: "/uploads/abc123.jpg"
        //
        // Content-Type: multipart/form-data
        // Campos: Nome, Especie, Raca, Idade, Porte, StatusAdocao, Descricao, Foto (file)
        // ─────────────────────────────────────────────────────────────
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Animal>> PostAnimal([FromForm] AnimalFormDto form)
        {
            // 1. Processa o upload da imagem (se enviada)
            string? caminhoFoto = null;

            if (form.Foto != null && form.Foto.Length > 0)
            {
                // Valida o tipo do arquivo
                if (!_tiposPermitidos.Contains(form.Foto.ContentType.ToLower()))
                    return BadRequest(new { mensagem = "Tipo de arquivo nao permitido. Use JPG, PNG, WEBP ou GIF." });

                // Valida o tamanho do arquivo
                if (form.Foto.Length > TAMANHO_MAXIMO)
                    return BadRequest(new { mensagem = "Imagem muito grande. Tamanho maximo: 5MB." });

                // Garante que a pasta wwwroot/uploads existe
                var pastaUploads = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(pastaUploads))
                    Directory.CreateDirectory(pastaUploads);

                // Gera nome unico para o arquivo (GUID + extensao original)
                var extensao  = Path.GetExtension(form.Foto.FileName).ToLower();
                var nomeArq   = $"{Guid.NewGuid()}{extensao}";
                var caminhoFisico = Path.Combine(pastaUploads, nomeArq);

                // Salva o arquivo no disco
                using (var stream = new FileStream(caminhoFisico, FileMode.Create))
                {
                    await form.Foto.CopyToAsync(stream);
                }

                // Salva no banco apenas o caminho web (nao o caminho fisico)
                // Exemplo: "/uploads/a1b2c3d4.jpg"
                caminhoFoto = $"/uploads/{nomeArq}";
            }

            // 2. Cria o objeto Animal para salvar no banco
            var animal = new Animal
            {
                Nome         = form.Nome,
                Especie      = form.Especie,
                Raca         = form.Raca,
                Idade        = form.Idade,
                Porte        = form.Porte,
                StatusAdocao = form.StatusAdocao ?? "disponivel",
                Descricao    = form.Descricao,
                FotoUrl      = caminhoFoto,       // caminho da imagem salva
                DataEntrada  = DateTime.Now
            };

            // 3. Salva no banco de dados
            _context.Animais.Add(animal);
            await _context.SaveChangesAsync();

            // 4. Retorna o animal completo com o ID gerado e a URL da foto
            return CreatedAtAction(
                nameof(GetAnimal),
                new { id = animal.IdAnimal },
                animal
            );
        }

        // ─────────────────────────────────────────────────────────────
        // PUT api/animais/1
        // Atualiza dados + permite trocar a foto
        // ─────────────────────────────────────────────────────────────
        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> PutAnimal(int id, [FromForm] AnimalFormDto form)
        {
            // Busca o animal existente
            var animal = await _context.Animais.FindAsync(id);
            if (animal == null)
                return NotFound(new { mensagem = $"Animal com ID {id} não encontrado" });

            // Atualiza os campos de texto
            animal.Nome         = form.Nome;
            animal.Especie      = form.Especie;
            animal.Raca         = form.Raca;
            animal.Idade        = form.Idade;
            animal.Porte        = form.Porte;
            animal.StatusAdocao = form.StatusAdocao ?? animal.StatusAdocao;
            animal.Descricao    = form.Descricao;

            // Processa nova foto (se enviada)
            if (form.Foto != null && form.Foto.Length > 0)
            {
                if (!_tiposPermitidos.Contains(form.Foto.ContentType.ToLower()))
                    return BadRequest(new { mensagem = "Tipo de arquivo não permitido." });

                if (form.Foto.Length > TAMANHO_MAXIMO)
                    return BadRequest(new { mensagem = "Imagem muito grande. Tamanho máximo: 5MB." });

                // Remove a foto antiga do disco (se existir)
                if (!string.IsNullOrEmpty(animal.FotoUrl))
                {
                    var caminhoAntigo = Path.Combine(_env.WebRootPath, animal.FotoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(caminhoAntigo))
                        System.IO.File.Delete(caminhoAntigo);
                }

                // Salva a nova foto
                var pastaUploads = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(pastaUploads))
                    Directory.CreateDirectory(pastaUploads);

                var extensao  = Path.GetExtension(form.Foto.FileName).ToLower();
                var nomeArq   = $"{Guid.NewGuid()}{extensao}";
                var caminhoFisico = Path.Combine(pastaUploads, nomeArq);

                using (var stream = new FileStream(caminhoFisico, FileMode.Create))
                {
                    await form.Foto.CopyToAsync(stream);
                }

                animal.FotoUrl = $"/uploads/{nomeArq}";
            }

            // Salva as alterações no banco
            _context.Entry(animal).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ─────────────────────────────────────────────────────────────
        // DELETE api/animais/1
        // Remove o animal e a foto do disco
        // ─────────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnimal(int id)
        {
            var animal = await _context.Animais.FindAsync(id);
            if (animal == null)
                return NotFound(new { mensagem = $"Animal com ID {id} não encontrado" });

            // Remove a foto do disco ao deletar o animal
            if (!string.IsNullOrEmpty(animal.FotoUrl))
            {
                var caminhoFisico = Path.Combine(_env.WebRootPath, animal.FotoUrl.TrimStart('/'));
                if (System.IO.File.Exists(caminhoFisico))
                    System.IO.File.Delete(caminhoFisico);
            }

            _context.Animais.Remove(animal);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}