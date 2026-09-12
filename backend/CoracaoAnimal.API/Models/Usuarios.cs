namespace CoracaoAnimal.API.Models
{
    /// <summary>
    /// Representa um usuário com acesso ao sistema (adotante comum ou administrador da ONG).
    /// Substitui o login simulado do PIM III, que existia apenas no frontend (localStorage).
    /// </summary>
    public class Usuario
    {
        /// <summary>Chave primaria — gerada automaticamente pelo banco</summary>
        public int IdUsuario { get; set; }

        /// <summary>Nome completo do usuario — obrigatorio</summary>
        public string NomeCompleto { get; set; } = string.Empty;

        /// <summary>E-mail — usado como login, deve ser unico</summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Hash da senha no formato "iteracoes.salt.hash" (PBKDF2/SHA256).
        /// NUNCA armazenar a senha em texto puro.
        /// </summary>
        public string SenhaHash { get; set; } = string.Empty;

        /// <summary>Tipo de acesso: "admin" ou "user"</summary>
        public string Tipo { get; set; } = "user";

        /// <summary>Data de cadastro — preenchida automaticamente</summary>
        public DateTime DataCadastro { get; set; } = DateTime.Now;
    }
}