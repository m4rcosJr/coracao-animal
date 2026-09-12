using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Services
{
    /// <summary>
    /// Gera o token JWT que o usuario vai usar pra se autenticar nas proximas
    /// requisicoes (tanto no site quanto no app mobile), sem precisar
    /// mandar e-mail/senha de novo a cada chamada.
    /// </summary>
    public class TokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string GerarToken(Usuario usuario)
        {
            // "Claims" = informacoes sobre o usuario que ficam dentro do token
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new(ClaimTypes.Name, usuario.NomeCompleto),
                new(ClaimTypes.Email, usuario.Email),
                new(ClaimTypes.Role, usuario.Tipo) // usado pelo [Authorize(Roles = "admin")]
            };

            var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);
            var expiracaoMinutos = int.Parse(_config["Jwt:ExpiracaoMinutos"] ?? "120");

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiracaoMinutos),
                signingCredentials: credenciais
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}