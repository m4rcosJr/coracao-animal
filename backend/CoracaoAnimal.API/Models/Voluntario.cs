namespace CoracaoAnimal.API.Models
{
    /// <summary>
    /// Representa um voluntário que colabora com a ONG Coração Animal
    /// </summary>
    public class Voluntario
    {
        /// <summary>
        /// Identificador único do voluntário, gerado automaticamente pelo banco
        /// </summary>
        public int IdVoluntario { get; set; }

        /// <summary>
        /// Nome completo do voluntário — campo obrigatório
        /// </summary>
        public string NomeCompleto { get; set; } = string.Empty;

        /// <summary>
        /// E-mail do voluntário — deve ser único quando informado
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Telefone de contato — campo opcional
        /// </summary>
        public string? Telefone { get; set; }

        /// <summary>
        /// Área de atuação: cuidados animais, transporte, fotografia, etc.
        /// </summary>
        public string? AreaAtuacao { get; set; }

        /// <summary>
        /// Data de início das atividades voluntárias — preenchida automaticamente
        /// </summary>
        public DateTime DataInicio { get; set; } = DateTime.Now;
    }
}
