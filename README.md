<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-brightgreen?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/C%23-ASP.NET%20Core-blue?style=for-the-badge&logo=dotnet"/>
  <img src="https://img.shields.io/badge/SQL%20Server-2025-red?style=for-the-badge&logo=microsoftsqlserver"/>
  <img src="https://img.shields.io/badge/HTML%20%7C%20CSS%20%7C%20JS-Frontend-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Swagger-API%20Docs-green?style=for-the-badge&logo=swagger"/>
  <img src="https://img.shields.io/badge/UNIP-PIM%20III-purple?style=for-the-badge"/>
</p>

<h1 align="center">🐾 Coração Animal</h1>
<p align="center">Sistema web para divulgação e adoção responsável de cães e gatos</p>
<p align="center"><em>Projeto Integrado Multidisciplinar III — Análise e Desenvolvimento de Sistemas — UNIP</em></p>

---

## 📋 Sobre o Projeto

A **ONG Coração Animal** é uma organização fictícia sem fins lucrativos criada para o desenvolvimento do PIM III do curso de Análise e Desenvolvimento de Sistemas da Universidade Paulista (UNIP).

O sistema web tem como objetivo facilitar a **adoção responsável de cães e gatos**, conectando animais disponíveis a potenciais adotantes por meio de uma plataforma digital acessível, responsiva e inclusiva.

---

## ✅ Status do Projeto

| Etapa | Status | Descrição |
|-------|--------|-----------|
| Banco de Dados SQL | ✅ Concluído | 5 tabelas criadas no SQL Server 2025 |
| Models C# | ✅ Concluído | 5 classes com relacionamentos e POO |
| API REST (Backend) | ✅ Concluído | 25 endpoints em 5 Controllers |
| Documentação da API | ✅ Concluído | Swagger disponível em /swagger |
| Frontend | 🔄 Em desenvolvimento | HTML, CSS, JavaScript |
| UX/UI Design | 🔄 Em desenvolvimento | Wireframes e personas |
| Machine Learning | 🔄 Em desenvolvimento | Recomendação por perfil |
| LIBRAS / Acessibilidade | 🔄 Em desenvolvimento | Glossário e recursos inclusivos |

---

## ✨ Funcionalidades

- 🐶 **Cadastro e listagem de animais** disponíveis para adoção
- 📋 **Formulário de adoção** com acompanhamento do processo
- 💰 **Sistema de doações** para apoio financeiro à ONG
- 🖥️ **Painel administrativo** para gestão completa
- 🤖 **Recomendação por Machine Learning** — sugestão de animais por perfil
- 🤟 **Acessibilidade em LIBRAS** — glossário e recursos inclusivos
- 📱 **Design responsivo** — compatível com celular, tablet e desktop

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Backend | C# com ASP.NET Core — API REST |
| Banco de Dados | SQL Server 2025 Express (SSMS) |
| ORM | Entity Framework Core |
| Frontend | HTML5, CSS3, JavaScript |
| Documentação API | Swagger / Swashbuckle |
| Machine Learning | Python (scikit-learn) |
| Versionamento | Git + GitHub |
| IDE | Visual Studio 2026 |
| Metodologia | Engenharia de Software Ágil (Scrum) |

---

## 🗄️ Banco de Dados

O banco **CoracaoAnimalDB** é composto por 5 tabelas:

| Tabela | Descrição |
|--------|-----------|
| `Animais` | Dados dos animais disponíveis para adoção |
| `Adotantes` | Cadastro de pessoas interessadas em adotar |
| `Voluntarios` | Colaboradores da ONG |
| `Adocoes` | Registro do processo de adoção |
| `Doacoes` | Contribuições financeiras recebidas |

---

## 🔌 API REST — Endpoints

A API conta com **25 endpoints** distribuídos em 5 Controllers:

### Animais
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/Animais` | Lista todos os animais |
| GET | `/api/Animais/{id}` | Busca animal por ID |
| POST | `/api/Animais` | Cadastra novo animal |
| PUT | `/api/Animais/{id}` | Atualiza animal |
| DELETE | `/api/Animais/{id}` | Remove animal |

### Adotantes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/Adotantes` | Lista todos os adotantes |
| GET | `/api/Adotantes/{id}` | Busca adotante por ID |
| POST | `/api/Adotantes` | Cadastra novo adotante |
| PUT | `/api/Adotantes/{id}` | Atualiza adotante |
| DELETE | `/api/Adotantes/{id}` | Remove adotante |

> Os mesmos 5 endpoints se aplicam para `/api/Adocoes`, `/api/Doacoes` e `/api/Voluntarios`

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Visual Studio 2026](https://visualstudio.microsoft.com/) com workload ASP.NET
- [SQL Server 2025 Express](https://www.microsoft.com/sql-server)
- [SQL Server Management Studio (SSMS)](https://aka.ms/ssms)
- [Git](https://git-scm.com/)
- [.NET SDK](https://dotnet.microsoft.com/download)

### Passo a passo

**1. Clone o repositório**
```bash
git clone https://github.com/m4rcosJr/coracao-animal.git
cd coracao-animal
```

**2. Configure o banco de dados**

No SSMS, execute o arquivo `banco-de-dados/create_tables.sql`:
```sql
CREATE DATABASE CoracaoAnimalDB;
USE CoracaoAnimalDB;
-- execute o script completo
```

**3. Configure a string de conexão**

Edite `backend/CoracaoAnimal.API/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "CoracaoAnimal": "Server=localhost\\SQLEXPRESS;Database=CoracaoAnimalDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**4. Execute o backend**
```bash
cd backend/CoracaoAnimal.API
dotnet run
```

**5. Acesse o Swagger**
```
http://localhost:5000/swagger
```

**6. Abra o frontend**

Abra o arquivo `frontend/index.html` no navegador.

---

## 📁 Estrutura do Repositório

```
coracao-animal/
├── README.md
├── .gitignore
│
├── banco-de-dados/
│   ├── create_tables.sql
│   └── documentacao/
│
├── backend/
│   └── CoracaoAnimal.API/
│       ├── Controllers/
│       │   ├── AnimaisController.cs
│       │   ├── AdotantesController.cs
│       │   ├── AdocoesController.cs
│       │   ├── DoacoesController.cs
│       │   └── VoluntariosController.cs
│       ├── Data/
│       │   └── AppDbContext.cs
│       ├── Models/
│       │   ├── Animal.cs
│       │   ├── Adotante.cs
│       │   ├── Adocao.cs
│       │   ├── Doacao.cs
│       │   └── Voluntario.cs
│       ├── appsettings.json
│       └── Program.cs
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── pages/
│
├── ml/
│   └── recomendacao.py
│
└── docs/
    ├── wireframes/
    ├── personas/
    └── PIM_III_Coracao_Animal.docx
```

---

## 👥 Equipe

| Membro | Responsabilidade | Branch |
|--------|-----------------|--------|
| Pessoa 1 | Líder · Backend C# · API REST | `feat/backend` |
| Pessoa 2 | Banco de Dados SQL · Modelagem | `feat/banco-dados` |
| Pessoa 3 | Frontend · HTML · CSS · JS | `feat/frontend` |
| Pessoa 4 | UX/UI Design · Wireframes · Ágil | `feat/ux-design` |
| Pessoa 5 | Machine Learning · Análise de Dados | `feat/ml` |
| Pessoa 6 | LIBRAS · Acessibilidade · Documentação ABNT | `feat/docs` |

---

## 🌿 Fluxo de Branches

```
main          ← código estável, aprovado pelo líder
  └── dev     ← integração das funcionalidades
        ├── feat/backend       ✅ concluído
        ├── feat/banco-dados   ✅ concluído
        ├── feat/frontend      🔄 em desenvolvimento
        ├── feat/ux-design     🔄 em desenvolvimento
        ├── feat/ml            🔄 em desenvolvimento
        └── feat/docs          🔄 em desenvolvimento
```

---

## 📐 Metodologia Ágil

O projeto é desenvolvido em **6 sprints de 2 semanas** cada:

| Sprint | Período | Status | Foco |
|--------|---------|--------|------|
| Sprint 1 | Semanas 1–2 | ✅ Concluído | Planejamento, requisitos e backlog |
| Sprint 2 | Semanas 3–4 | ✅ Concluído | Banco de dados e arquitetura |
| Sprint 3 | Semanas 5–6 | ✅ Concluído | Backend C# e API REST |
| Sprint 4 | Semanas 7–8 | 🔄 Em andamento | Frontend responsivo |
| Sprint 5 | Semanas 9–10 | ⏳ Aguardando | Machine Learning e LIBRAS |
| Sprint 6 | Semanas 11–12 | ⏳ Aguardando | Integração e documentação final |

---

## ♿ Acessibilidade e LIBRAS

O sistema incorpora recursos de acessibilidade digital seguindo as diretrizes **WCAG 2.1**, incluindo glossário em **Língua Brasileira de Sinais (LIBRAS)**, navegação por teclado, contraste adequado e compatibilidade com leitores de tela.

---

## 📚 Disciplinas Integradas (PIM III)

- Engenharia de Software Ágil Aplicada
- Modelagem de Banco de Dados e NoSQL
- Programação Orientada a Objetos com C#
- Desenvolvimento Web Responsivo
- UX e UI Design
- Machine Learning e Análise de Dados
- Comunicação, Liderança e Negociação
- Língua Brasileira de Sinais (LIBRAS)

---

## 📄 Licença

Este projeto foi desenvolvido exclusivamente para fins acadêmicos como parte do PIM III do curso de Análise e Desenvolvimento de Sistemas da **Universidade Paulista — UNIP**.

---

<p align="center">Feito com 🐾 pela equipe Coração Animal · UNIP 2025</p>
