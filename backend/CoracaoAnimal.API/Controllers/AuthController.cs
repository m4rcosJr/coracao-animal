using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;
using CoracaoAnimal.API.Models;
using CoracaoAnimal.API.Models.Auth;
using CoracaoAnimal.API.Services;

namespace CoracaoAnimal.API.Controllers
{
    /// <summary>
    /// Controlador responsavel por cadastro e login de usuarios.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly TokenService _tokenService;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, TokenService tokenService, IConfiguration config)
        {
            _context = context;
            _tokenService = tokenService;
            _config = config;
        }

        // ─────────────────────────────────────────────────────────────
        // POST api/auth/registrar
        // Cria um novo usuario comum (adotante). Contas admin sao promovidas
        // manualmente no banco — ver instrucoes no fim desta etapa.
        // ─────────────────────────────────────────────────────────────
        [HttpPost("registrar")]
        public async Task<ActionResult<AuthResponseDto>> Registrar(RegistroDto dto)
        {
            var emailJaExiste = await _context.Usuarios.AnyAsync(u => u.Email == dto.Email);
            if (emailJaExiste)
                return BadRequest(new { mensagem = "Ja existe uma conta com esse e-mail." });

            var usuario = new Usuario
            {
                NomeCompleto = dto.NomeCompleto,
                Email = dto.Email,
                SenhaHash = SenhaService.GerarHash(dto.Senha),
                Tipo = "user"
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(GerarResposta(usuario));
        }

        // ─────────────────────────────────────────────────────────────
        // POST api/auth/login
        // ─────────────────────────────────────────────────────────────
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (usuario == null || !SenhaService.VerificarSenha(dto.Senha, usuario.SenhaHash))
                return Unauthorized(new { mensagem = "E-mail ou senha invalidos." });

            return Ok(GerarResposta(usuario));
        }

        private AuthResponseDto GerarResposta(Usuario usuario)
        {
            var expiracaoMinutos = int.Parse(_config["Jwt:ExpiracaoMinutos"] ?? "120");
            return new AuthResponseDto
            {
                Token = _tokenService.GerarToken(usuario),
                NomeCompleto = usuario.NomeCompleto,
                Email = usuario.Email,
                Tipo = usuario.Tipo,
                ExpiraEm = DateTime.UtcNow.AddMinutes(expiracaoMinutos)
            };
        }
    }
}