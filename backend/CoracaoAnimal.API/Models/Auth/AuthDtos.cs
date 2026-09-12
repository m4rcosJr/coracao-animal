namespace CoracaoAnimal.API.Models.Auth
{
	/// <summary>Dados recebidos no cadastro de um novo usuario</summary>
	public class RegistroDto
	{
		public string NomeCompleto { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string Senha { get; set; } = string.Empty;
	}

	/// <summary>Dados recebidos no login</summary>
	public class LoginDto
	{
		public string Email { get; set; } = string.Empty;
		public string Senha { get; set; } = string.Empty;
	}

	/// <summary>Resposta enviada apos login ou cadastro bem-sucedido</summary>
	public class AuthResponseDto
	{
		public string Token { get; set; } = string.Empty;
		public string NomeCompleto { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string Tipo { get; set; } = string.Empty;
		public DateTime ExpiraEm { get; set; }
	}
}