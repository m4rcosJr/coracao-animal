
USE CoracaoAnimalDB;

CREATE TABLE Animais (
    id_animal     INT PRIMARY KEY IDENTITY(1,1),
    nome          VARCHAR(100) NOT NULL,
    especie       VARCHAR(10)  CHECK(especie IN ('cao','gato')),
    raca          VARCHAR(80),
    idade         INT,
    porte         VARCHAR(15)  CHECK(porte IN ('pequeno','medio','grande')),
    status_adocao VARCHAR(20)  DEFAULT 'disponivel',
    descricao     TEXT,
    foto_url      VARCHAR(255),
    data_entrada  DATE         DEFAULT GETDATE()
);

CREATE TABLE Adotantes (
    id_adotante   INT PRIMARY KEY IDENTITY(1,1),
    nome_completo VARCHAR(150) NOT NULL,
    cpf           VARCHAR(14)  UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    telefone      VARCHAR(20),
    endereco      VARCHAR(255),
    data_cadastro DATE         DEFAULT GETDATE()
);

CREATE TABLE Voluntarios (
    id_voluntario INT PRIMARY KEY IDENTITY(1,1),
    nome_completo VARCHAR(150) NOT NULL,
    email         VARCHAR(100) UNIQUE,
    telefone      VARCHAR(20),
    area_atuacao  VARCHAR(100),
    data_inicio   DATE         DEFAULT GETDATE()
);

CREATE TABLE Adocoes (
    id_adocao   INT PRIMARY KEY IDENTITY(1,1),
    id_animal   INT NOT NULL,
    id_adotante INT NOT NULL,
    data_adocao DATE        DEFAULT GETDATE(),
    status      VARCHAR(20) DEFAULT 'em_andamento',
    observacoes TEXT,
    FOREIGN KEY (id_animal)   REFERENCES Animais(id_animal),
    FOREIGN KEY (id_adotante) REFERENCES Adotantes(id_adotante)
);

CREATE TABLE Doacoes (
    id_doacao        INT PRIMARY KEY IDENTITY(1,1),
    id_adotante      INT,
    valor            DECIMAL(10,2) NOT NULL,
    data_doacao      DATE          DEFAULT GETDATE(),
    forma_pagamento  VARCHAR(30),
    status_pagamento VARCHAR(20)   DEFAULT 'confirmado',
    descricao        VARCHAR(255),
    FOREIGN KEY (id_adotante) REFERENCES Adotantes(id_adotante)
);

SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_CATALOG = 'CoracaoAnimalDB';

SELECT * FROM  Adotantes;