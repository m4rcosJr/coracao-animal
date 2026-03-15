namespace CoracaoAnimal.API.Models
{
	/// <summary>
	/// Representa uma pessoa interessada em adotar um animal da ONG Coração Animal
	/// </summary>
	public class Adotante
	{
		/// <summary>
		/// Identificador único do adotante, gerado automaticamente pelo banco
		/// </summary>
		public int IdAdotante { get; set; }

		/// <summary>
		/// Nome completo do adotante — campo obrigatório
		/// </summary>
		public string NomeCompleto { get; set; } = string.Empty;

		/// <summary>
		/// CPF do adotante no formato 000.000.000-00 — deve ser único
		/// </summary>
		public string Cpf { get; set; } = string.Empty;

		/// <summary>
		/// E-mail do adotante — deve ser único no sistema
		/// </summary>
		public string Email { get; set; } = string.Empty;

		/// <summary>
		/// Telefone de contato — campo opcional
		/// </summary>
		public string? Telefone { get; set; }

		/// <summary>
		/// Endereço residencial completo — campo opcional
		/// </summary>
		public string? Endereco { get; set; }

		/// <summary>
		/// Data de cadastro no sistema — preenchida automaticamente
		/// </summary>
		public DateTime DataCadastro { get; set; } = DateTime.Now;

		/// <summary>
		/// Lista de adoções realizadas por este adotante
		/// </summary>
		public ICollection<Adocao> Adocoes { get; set; } = new List<Adocao>();

		/// <summary>
		/// Lista de doações realizadas por este adotante
		/// </summary>
		public ICollection<Doacao> Doacoes { get; set; } = new List<Doacao>();
	}
}