using Microsoft.EntityFrameworkCore;
using CoracaoAnimal.API.Models;

namespace CoracaoAnimal.API.Data
{
	/// <summary>
	/// Contexto principal do banco de dados da ONG Coração Animal.
	/// É a ponte entre as classes C# e as tabelas do SQL Server.
	/// </summary>
	public class AppDbContext : DbContext
	{
		/// <summary>
		/// Construtor que recebe as configurações de conexão
		/// </summary>
		public AppDbContext(DbContextOptions<AppDbContext> options)
			: base(options) { }

		/// <summary>
		/// Representa a tabela Animais no banco de dados
		/// </summary>
		public DbSet<Animal> Animais { get; set; }

		/// <summary>
		/// Representa a tabela Adotantes no banco de dados
		/// </summary>
		public DbSet<Adotante> Adotantes { get; set; }

		/// <summary>
		/// Representa a tabela Voluntarios no banco de dados
		/// </summary>
		public DbSet<Voluntario> Voluntarios { get; set; }

		/// <summary>
		/// Representa a tabela Adocoes no banco de dados
		/// </summary>
		public DbSet<Adocao> Adocoes { get; set; }

		/// <summary>
		/// Representa a tabela Doacoes no banco de dados
		/// </summary>
		public DbSet<Doacao> Doacoes { get; set; }

		/// <summary>
		/// Configurações de mapeamento entre classes C# e tabelas SQL
		/// </summary>
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
            // ─────────────────────────────────────────
            // ANIMAL
            // ─────────────────────────────────────────
            modelBuilder.Entity<Animal>()
                .ToTable("Animais")
                .HasKey(a => a.IdAnimal);

            modelBuilder.Entity<Animal>().Property(a => a.IdAnimal).HasColumnName("id_animal");
            modelBuilder.Entity<Animal>().Property(a => a.Nome).HasColumnName("nome");
            modelBuilder.Entity<Animal>().Property(a => a.Especie).HasColumnName("especie");
            modelBuilder.Entity<Animal>().Property(a => a.Raca).HasColumnName("raca");
            modelBuilder.Entity<Animal>().Property(a => a.Idade).HasColumnName("idade");
            modelBuilder.Entity<Animal>().Property(a => a.Porte).HasColumnName("porte");
            modelBuilder.Entity<Animal>().Property(a => a.StatusAdocao).HasColumnName("status_adocao");
            modelBuilder.Entity<Animal>().Property(a => a.Descricao).HasColumnName("descricao");
            modelBuilder.Entity<Animal>().Property(a => a.FotoUrl).HasColumnName("foto_url");
            modelBuilder.Entity<Animal>().Property(a => a.DataEntrada).HasColumnName("data_entrada");

            // ─────────────────────────────────────────
            // ADOTANTE
            // ─────────────────────────────────────────
            modelBuilder.Entity<Adotante>()
                .ToTable("Adotantes")
                .HasKey(a => a.IdAdotante);

            modelBuilder.Entity<Adotante>().Property(a => a.IdAdotante).HasColumnName("id_adotante");
            modelBuilder.Entity<Adotante>().Property(a => a.NomeCompleto).HasColumnName("nome_completo");
            modelBuilder.Entity<Adotante>().Property(a => a.Cpf).HasColumnName("cpf");
            modelBuilder.Entity<Adotante>().Property(a => a.Email).HasColumnName("email");
            modelBuilder.Entity<Adotante>().Property(a => a.Telefone).HasColumnName("telefone");
            modelBuilder.Entity<Adotante>().Property(a => a.Endereco).HasColumnName("endereco");
            modelBuilder.Entity<Adotante>().Property(a => a.DataCadastro).HasColumnName("data_cadastro");

            // ─────────────────────────────────────────
            // VOLUNTARIO
            // ─────────────────────────────────────────
            modelBuilder.Entity<Voluntario>()
                .ToTable("Voluntarios")
                .HasKey(v => v.IdVoluntario);

            modelBuilder.Entity<Voluntario>().Property(v => v.IdVoluntario).HasColumnName("id_voluntario");
            modelBuilder.Entity<Voluntario>().Property(v => v.NomeCompleto).HasColumnName("nome_completo");
            modelBuilder.Entity<Voluntario>().Property(v => v.Email).HasColumnName("email");
            modelBuilder.Entity<Voluntario>().Property(v => v.Telefone).HasColumnName("telefone");
            modelBuilder.Entity<Voluntario>().Property(v => v.AreaAtuacao).HasColumnName("area_atuacao");
            modelBuilder.Entity<Voluntario>().Property(v => v.DataInicio).HasColumnName("data_inicio");

            // ─────────────────────────────────────────
            // ADOCAO
            // ─────────────────────────────────────────
            modelBuilder.Entity<Adocao>()
                .ToTable("Adocoes")
                .HasKey(a => a.IdAdocao);

            modelBuilder.Entity<Adocao>().Property(a => a.IdAdocao).HasColumnName("id_adocao");
            modelBuilder.Entity<Adocao>().Property(a => a.IdAnimal).HasColumnName("id_animal");
            modelBuilder.Entity<Adocao>().Property(a => a.IdAdotante).HasColumnName("id_adotante");
            modelBuilder.Entity<Adocao>().Property(a => a.DataAdocao).HasColumnName("data_adocao");
            modelBuilder.Entity<Adocao>().Property(a => a.Status).HasColumnName("status");
            modelBuilder.Entity<Adocao>().Property(a => a.Observacoes).HasColumnName("observacoes");

            // Relacionamento: uma adocao tem um animal
            modelBuilder.Entity<Adocao>()
                .HasOne(a => a.Animal)
                .WithMany()
                .HasForeignKey(a => a.IdAnimal);

            // Relacionamento: uma adocao tem um adotante
            modelBuilder.Entity<Adocao>()
                .HasOne(a => a.Adotante)
                .WithMany(ad => ad.Adocoes)
                .HasForeignKey(a => a.IdAdotante);

            // ─────────────────────────────────────────
            // DOACAO
            // ─────────────────────────────────────────
            modelBuilder.Entity<Doacao>()
                .ToTable("Doacoes")
                .HasKey(d => d.IdDoacao);

            modelBuilder.Entity<Doacao>().Property(d => d.IdDoacao).HasColumnName("id_doacao");
            modelBuilder.Entity<Doacao>().Property(d => d.IdAdotante).HasColumnName("id_adotante");
            modelBuilder.Entity<Doacao>().Property(d => d.Valor).HasColumnName("valor");
            modelBuilder.Entity<Doacao>().Property(d => d.DataDoacao).HasColumnName("data_doacao");
            modelBuilder.Entity<Doacao>().Property(d => d.FormaPagamento).HasColumnName("forma_pagamento");
            modelBuilder.Entity<Doacao>().Property(d => d.StatusPagamento).HasColumnName("status_pagamento");
            modelBuilder.Entity<Doacao>().Property(d => d.Descricao).HasColumnName("descricao");

            // Relacionamento: uma doacao pode ter um adotante (opcional)
            modelBuilder.Entity<Doacao>()
                .HasOne(d => d.Adotante)
                .WithMany(a => a.Doacoes)
                .HasForeignKey(d => d.IdAdotante);
        }
    }
}