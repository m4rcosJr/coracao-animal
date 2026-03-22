using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;

// ─────────────────────────────────────────────────────────
// BUILDER — configura os servicos da aplicacao
// ─────────────────────────────────────────────────────────

// Inicia a construcao da aplicacao
// le automaticamente o appsettings.json
var builder = WebApplication.CreateBuilder(args);

// Configura o CORS (Cross-Origin Resource Sharing)
// CORS e uma politica de seguranca do navegador que bloqueia
// chamadas entre dominios/portas diferentes por padrao.
// Sem isso, o frontend em localhost:5500 nao consegue
// chamar a API em localhost:5000 — o navegador bloqueia.
// AllowAnyOrigin()  → aceita requisicoes de qualquer endereco
// AllowAnyMethod()  → aceita GET, POST, PUT, DELETE, etc.
// AllowAnyHeader()  → aceita qualquer cabecalho HTTP
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Registra o AppDbContext como servico
// busca a string de conexao "CoracaoAnimal" do appsettings.json
// e conecta ao SQL Server via Entity Framework
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("CoracaoAnimal")
    )
);

// Registra os Controllers da API
// sem isso a aplicacao nao encontra as rotas (endpoints)
builder.Services.AddControllers();

// Registra o Swagger — interface visual para testar a API
// acessivel pelo navegador em: http://localhost:5000/swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ─────────────────────────────────────────────────────────
// APP — configura o pipeline de requisicoes
// ─────────────────────────────────────────────────────────

// Constroi a aplicacao com todas as configuracoes acima
var app = builder.Build();

// Ativa o Swagger e sua interface visual
app.UseSwagger();
app.UseSwaggerUI();

// Ativa o middleware de CORS
// IMPORTANTE: deve vir ANTES do UseAuthorization e MapControllers
// para que toda requisicao seja verificada antes de chegar nos endpoints
app.UseCors("PermitirFrontend");

// Ativa o middleware de autorizacao
// necessario para proteger rotas no futuro
app.UseAuthorization();

// Mapeia os Controllers como rotas da API
// ex: AnimaisController vira /api/animais
app.MapControllers();

// Inicia o servidor e a API comeca a ouvir requisicoes
app.Run();