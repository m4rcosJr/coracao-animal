namespace CoracaoAnimal.API.Models
{
    /// <summary>
    /// Representa um animal disponivel para adocao na ONG Coracao Animal.
    /// O campo FotoUrl armazena apenas o caminho da imagem — nunca binario.
    /// Exemplo de FotoUrl: "/uploads/a1b2c3d4-1234-5678-abcd-ef0123456789.jpg"
    /// </summary>
    public class Animal
    {
        /// <summary>Chave primaria — gerada automaticamente pelo banco</summary>
        public int IdAnimal { get; set; }

        /// <summary>Nome do animal — obrigatorio</summary>
        public string Nome { get; set; } = string.Empty;

        /// <summary>Especie: "cao" ou "gato"</summary>
        public string? Especie { get; set; }

        /// <summary>Raca do animal — opcional</summary>
        public string? Raca { get; set; }

        /// <summary>Idade em anos — opcional</summary>
        public int? Idade { get; set; }

        /// <summary>Porte: "pequeno", "medio" ou "grande"</summary>
        public string? Porte { get; set; }

        /// <summary>
        /// Status de adocao: "disponivel", "em_processo", "adotado", "em_tratamento"
        /// Valor padrao: "disponivel"
        /// </summary>
        public string StatusAdocao { get; set; } = "disponivel";

        /// <summary>Descricao livre sobre o animal</summary>
        public string? Descricao { get; set; }

        /// <summary>
        /// Caminho da foto salva em wwwroot/uploads.
        /// Exemplo: "/uploads/abc123.jpg"
        /// Para exibir no frontend: http://localhost:5000/uploads/abc123.jpg
        /// NUNCA salvar o binario da imagem aqui — apenas o caminho.
        /// </summary>
        public string? FotoUrl { get; set; }

        /// <summary>Data de entrada na ONG — preenchida automaticamente</summary>
        public DateTime DataEntrada { get; set; } = DateTime.Now;
    }
}