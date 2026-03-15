namespace CoracaoAnimal.API.Models
{
    public class Animal
    {
        public int IdAnimal { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Especie { get; set; }
        public string? Raca { get; set; }
        public int? Idade { get; set; }
        public string? Porte { get; set; }
        public string StatusAdocao { get; set; } = "disponivel";
        public string? Descricao { get; set; }
        public string? FotoUrl { get; set; }
        public DateTime DataEntrada { get; set; } = DateTime.Now;
    }
}

/*

Explicação linha a linha:
namespace CoracaoAnimal.API.Models → define o "endereço" da classe dentro do projeto. 
É como uma pasta lógica — outros arquivos vão usar using CoracaoAnimal.API.Models para acessar essa classe.

public class Animal → declara a classe. public significa que ela pode ser acessada por qualquer outro arquivo do projeto.

public int IdAnimal { get; set; } → propriedade que representa a coluna id_animal do banco. get; set; significa que o valor pode ser lido e alterado — é o padrão C# para propriedades.

public string Nome { get; set; } = string.Empty → campo obrigatório, nunca nulo. O = string.Empty garante que começa como texto vazio em vez de null.

public string? Especie { get; set; } → o ? depois do tipo significa que o campo é opcional — pode ser nulo. Igual ao campo sem NOT NULL no SQL.

public string StatusAdocao { get; set; } = "disponivel" → valor padrão igual ao DEFAULT 'disponivel' que definimos no banco.

public DateTime DataEntrada { get; set; } = DateTime.Now → equivalente ao DEFAULT GETDATE() do SQL — preenche automaticamente com a data atual.
 
 */