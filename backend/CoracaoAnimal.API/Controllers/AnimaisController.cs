// Importa as bibliotecas necessarias para o Controller funcionar
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Controllers
{
	// Diz ao ASP.NET que essa classe e um Controller de API
	// Ativa validacoes automaticas de dados recebidos
	[ApiController]

	// Define o endereco (rota) desse Controller na API
	// [controller] e substituido automaticamente por "animais"
	// resultado: todos os endpoints comecam com api/animais
	[Route("api/[controller]")]

	// Herda de ControllerBase que ja tem metodos prontos
	// como NotFound(), BadRequest(), NoContent()
	public class AnimaisController : ControllerBase
	{
		// Variavel privada que guarda a conexao com o banco
		// readonly = nao pode ser alterada depois de criada
		// _ no inicio = convencao para variaveis privadas em C#
		private readonly AppDbContext _context;

		// Construtor do Controller
		// O ASP.NET injeta o AppDbContext automaticamente aqui
		// nao precisamos criar o contexto manualmente
		public AnimaisController(AppDbContext context)
		{
			// salva o contexto recebido na variavel privada
			// assim todos os metodos abaixo podem usar o banco
			_context = context;
		}

		// ─────────────────────────────────────────
		// GET api/animais
		// Retorna a lista completa de animais
		// ─────────────────────────────────────────
		[HttpGet]
		public async Task<ActionResult<IEnumerable<Animal>>> GetAnimais()
		{
			// busca todos os registros da tabela Animais
			// ToListAsync = converte para lista de forma assincrona
			// async/await = nao trava a API enquanto espera o banco
			return await _context.Animais.ToListAsync();
		}

		// ─────────────────────────────────────────
		// GET api/animais/1
		// Retorna um animal especifico pelo ID
		// ─────────────────────────────────────────
		[HttpGet("{id}")]
		public async Task<ActionResult<Animal>> GetAnimal(int id)
		{
			// busca o animal pelo id informado na URL
			// ex: GET api/animais/1 busca o animal com id = 1
			var animal = await _context.Animais.FindAsync(id);

			// se nao encontrou, retorna erro 404 (nao encontrado)
			if (animal == null)
				return NotFound();

			// se encontrou, retorna o animal com codigo 200 (OK)
			return animal;
		}

		// ─────────────────────────────────────────
		// POST api/animais
		// Cadastra um novo animal no banco
		// ─────────────────────────────────────────
		[HttpPost]
		public async Task<ActionResult<Animal>> PostAnimal(Animal animal)
		{
			// adiciona o animal na lista de pendencias do EF
			_context.Animais.Add(animal);

			// salva efetivamente no banco de dados SQL
			await _context.SaveChangesAsync();

			// retorna codigo 201 (criado com sucesso)
			// e o endereco onde o novo animal pode ser consultado
			// ex: GET api/animais/1
			return CreatedAtAction(
				nameof(GetAnimal),        // nome do metodo de busca
				new { id = animal.IdAnimal }, // id do animal criado
				animal                    // dados do animal criado
			);
		}

		// ─────────────────────────────────────────
		// PUT api/animais/1
		// Atualiza os dados de um animal existente
		// ─────────────────────────────────────────
		[HttpPut("{id}")]
		public async Task<IActionResult> PutAnimal(int id, Animal animal)
		{
			// verifica se o id da URL bate com o id do objeto recebido
			// ex: PUT api/animais/1 mas o objeto tem IdAnimal = 2
			// isso seria um erro — ids diferentes nao fazem sentido
			if (id != animal.IdAnimal)
				return BadRequest();

			// marca o animal como modificado no EF
			// o EF vai gerar um UPDATE no banco automaticamente
			_context.Entry(animal).State = EntityState.Modified;

			// salva as alteracoes no banco
			await _context.SaveChangesAsync();

			// retorna codigo 204 (sucesso sem conteudo)
			// significa: "atualizei mas nao tenho nada para retornar"
			return NoContent();
		}

		// ─────────────────────────────────────────
		// DELETE api/animais/1
		// Remove um animal pelo ID
		// ─────────────────────────────────────────
		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteAnimal(int id)
		{
			// busca o animal pelo id antes de deletar
			var animal = await _context.Animais.FindAsync(id);

			// se nao encontrou, retorna erro 404
			if (animal == null)
				return NotFound();

			// remove o animal da tabela
			_context.Animais.Remove(animal);

			// salva a remocao no banco
			await _context.SaveChangesAsync();

			// retorna codigo 204 (sucesso sem conteudo)
			return NoContent();
		}
	}
}