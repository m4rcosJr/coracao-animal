namespace CoracaoAnimal.API.Models
{
    /// <summary>
    /// Representa uma contribuição financeira recebida pela ONG Coração Animal
    /// </summary>
    public class Doacao
    {
        /// <summary>
        /// Identificador único da doação, gerado automaticamente pelo banco
        /// </summary>
        public int IdDoacao { get; set; }

        /// <summary>
        /// ID do adotante doador — opcional, pois doações podem ser anônimas
        /// </summary>
        public int? IdAdotante { get; set; }

        /// <summary>
        /// Valor da doação em reais — campo obrigatório
        /// </summary>
        public decimal Valor { get; set; }

        /// <summary>
        /// Data em que a doação foi registrada — preenchida automaticamente
        /// </summary>
        public DateTime DataDoacao { get; set; } = DateTime.Now;

        /// <summary>
        /// Forma de pagamento: PIX, cartão, boleto, dinheiro
        /// </summary>
        public string? FormaPagamento { get; set; }

        /// <summary>
        /// Situação do pagamento: confirmado, pendente ou cancelado
        /// </summary>
        public string StatusPagamento { get; set; } = "confirmado";

        /// <summary>
        /// Observação livre sobre a doação — campo opcional
        /// </summary>
        public string? Descricao { get; set; }

        /// <summary>
        /// Objeto Adotante vinculado à doação — nulo quando doação anônima
        /// </summary>
        public Adotante? Adotante { get; set; }
    }
}