using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;

// ─────────────────────────────────────────────────────
// BUILDER — configura os serviços da aplicação
// ───────────────────────────────────────────────────────────

// Inicia a construção da aplicação
var builder = WebApplication.CreateBuilder(args);

// Configura o CORS — permite que o frontend chame a API
// sem isso o navegador bloqueia as requisicoes (erro de CORS)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()   // aceita requisicoes de qualquer endereco
            .AllowAnyMethod()   // aceita GET, POST, PUT, DELETE, etc.
            .AllowAnyHeader();  // aceita qualquer cabecalho HTTP
    });
});

// Registra o AppDbContext com a string de conexão do appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("CoracaoAnimal")
    )
);

// Registra os Controllers — sem isso a API não encontra as rotas
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = 
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
    
// Registra o Swagger — interface visual para testar a API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Configura o Swagger para suportar upload de arquivo (multipart/form-data)
    // sem isso o Swagger nao exibe o campo de upload corretamente
    c.SwaggerDoc("v1", new() { Title = "Coracao Animal API", Version = "v1" });
});

// Configura limite de tamanho do body para uploads (padrao e 28MB)
// ajuste conforme necessario
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB maximo
});

// ─────────────────────────────────────────────────────
// APP — configura o pipeline de requisicoes
// ─────────────────────────────────────────────────────

var app = builder.Build();

// Ativa o Swagger (interface de testes: http://localhost:5000/swagger)
app.UseSwagger();
app.UseSwaggerUI();

// *** CHAVE PARA O UPLOAD FUNCIONAR ***
// Ativa o serviço de arquivos estáticos — sem isso as imagens
// salvas em wwwroot/uploads NÃO ficam acessíveis via HTTP
// Depois de ativar: http://localhost:5000/uploads/nome.jpg funciona
app.UseStaticFiles();

// Ativa o CORS — deve vir ANTES do UseAuthorization
app.UseCors("PermitirFrontend");

// Ativa o middleware de autorização
app.UseAuthorization();

// Mapeia os Controllers como rotas da API
// AnimaisController -> /api/animais
app.MapControllers();

// Inicia o servidor
app.Run();