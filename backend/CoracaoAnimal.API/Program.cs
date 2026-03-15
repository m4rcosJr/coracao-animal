using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Data;

// BUILDER - configura os servicos da aplicacao
var builder = WebApplication.CreateBuilder(args);

// Registra o AppDbContext com a string de conexao do appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("CoracaoAnimal")
    )
);

// Registra os Controllers da API
builder.Services.AddControllers();

// Registra o Swagger para testar a API no navegador
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// APP - configura o pipeline de requisicoes
var app = builder.Build();

// Ativa o Swagger
app.UseSwagger();
app.UseSwaggerUI();

// Redireciona HTTP para HTTPS
app.UseHttpsRedirection();

// Ativa autorizacao
app.UseAuthorization();

// Liga os Controllers as rotas da API
app.MapControllers();

// Inicia o servidor
app.Run();