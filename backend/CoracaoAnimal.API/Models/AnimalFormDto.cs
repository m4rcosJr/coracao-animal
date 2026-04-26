namespace CoracaoAnimal.API.Models
{
    /// <summary>
    /// DTO (Data Transfer Object) para receber dados do formulario de cadastro de animal.
    ///
    /// Por que usar DTO em vez do Model diretamente?
    /// O Model Animal nao pode receber IFormFile (arquivo), pois o Entity Framework
    /// nao sabe o que fazer com esse tipo — ele e apenas para dados do banco.
    /// O DTO e um objeto intermediario que recebe os dados do formulario,
    /// incluindo o arquivo, e depois converte para o Model.
    ///
    /// Content-Type necessario: multipart/form-data
    /// </summary>
    public class AnimalFormDto
    {
        // Campo de texto obrigatorio
        public string Nome { get; set; } = string.Empty;

        // Campos opcionais de texto
        public string? Especie      { get; set; }
        public string? Raca         { get; set; }
        public int?    Idade        { get; set; }
        public string? Porte        { get; set; }
        public string? StatusAdocao { get; set; }
        public string? Descricao    { get; set; }

        // Campo de arquivo — nulo quando nenhuma imagem e enviada
        // IFormFile e o tipo do ASP.NET para receber arquivos via multipart/form-data
        public IFormFile? Foto { get; set; }
    }
}