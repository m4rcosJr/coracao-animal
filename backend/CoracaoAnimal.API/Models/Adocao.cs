namespace CoracaoAnimal.API.Models
{
    /// <summary>
    /// Representa o processo de adoção de um animal da ONG Coração Animal
    /// </summary>
    public class Adocao
    {
        /// <summary>
        /// Identificador único da adoção, gerado automaticamente pelo banco
        /// </summary>
        public int IdAdocao { get; set; }

        /// <summary>
        /// ID do animal sendo adotado — chave estrangeira para a tabela Animais
        /// </summary>
        public int IdAnimal { get; set; }

        /// <summary>
        /// ID do adotante responsável — chave estrangeira para a tabela Adotantes
        /// </summary>
        public int IdAdotante { get; set; }

        /// <summary>
        /// Data em que a adoção foi registrada — preenchida automaticamente
        /// </summary>
        public DateTime DataAdocao { get; set; } = DateTime.Now;

        /// <summary>
        /// Situação atual da adoção: em_andamento, concluida ou cancelada
        /// </summary>
        public string Status { get; set; } = "em_andamento";

        /// <summary>
        /// Observações livres sobre o processo de adoção — campo opcional
        /// </summary>
        public string? Observacoes { get; set; }

        /// <summary>
        /// Objeto Animal completo vinculado a esta adoção
        /// </summary>
        public Animal? Animal { get; set; }

        /// <summary>
        /// Objeto Adotante completo vinculado a esta adoção
        /// </summary>
        public Adotante? Adotante { get; set; }
    }
}