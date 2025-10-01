# Guia de Inicialização do Projeto

Este guia mostra como configurar e executar o **backend** (captura de pacotes) e o **frontend** (interface visual) da aplicação.

## 🚀 Começando

Siga os passos abaixo para rodar o projeto localmente.

---
## Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados na sua máquina:

-   **Python 3.11**: Esta é a versão recomendada e testada para o backend. Versões mais recentes (como 3.12+) podem causar erros de incompatibilidade com as dependências.
    -   [**Faça o download aqui**](https://www.python.org/downloads/release/python-3118/)


## 1. Backend (Captura de Dados)

O backend é responsável por capturar os pacotes de rede.

### Passo 1: Preparar o Ambiente

1. **Clone o repositório** (se ainda não fez):  
    ```bash
        git clone https://github.com/StefissonRafaelHonorato/Redes.git
    ```

2. **Acessar diretório do backend**:
    ```bash
    cd Redes/backend
    ```

3.  **Crie um ambiente virtual com Python 3.11**:
    O comando exato depende do seu sistema operacional. Escolha a opção correspondente abaixo.

    ```bash
    # --- No Windows (use o Python Launcher) ---
    # Este comando garante que a versão 3.11 seja usada
    py -3.11 -m venv venv

    # --- No Linux ou macOS ---
    # Use o comando com a versão explícita
    python3.11 -m venv venv
    ```

4.  **Ative o ambiente virtual**:
    Após a criação, ative-o para começar a usar.

    ```bash
    # No Windows:
    .\venv\Scripts\activate

    # No Linux/macOS:
    source venv/bin/activate
    ```

5. **Instale as dependências**:  
    ```bash
        pip install -r requirements.txt
    ```

---

### Passo 2: Configurar Variável de Ambiente

1. **Copie o arquivo de exemplo do `.env`**:  
    ```bash
        cp .env.example .env
    ```

2. **Encontre seu IP local**: Abra o CMD ou PowerShell e rode:
    ```bash
        ipconfig
    ```
    Localize o endereço **IPv4**.

3. **Defina a variável `SERVER_IP`** no arquivo `.env`:
    ```env
        SERVER_IP=SEU_IP_AQUI
    ```

4. **Defina a variável `DATABASE_URL`** no arquivo `.env`
    (Lembrando que após o trabalho a url abaixo deixará de funcionar!): 
    ```env
        DATABASE_URL=postgres://neondb_owner:npg_wzEj4NI0UmhA@ep-shiny-hall-adr8dhc8-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
    ```

---

### Passo 3: Executar o Backend

1. Navegue até a pasta do backend (se ainda não estiver nela):  
    ```bash
        cd backend
    ```

2. Rode o script principal:  
    ```bash
        python run.py
    ```

> ⚠️ **Importante:** Mantenha este terminal aberto enquanto o backend estiver rodando.

---

### Passo 4: Executar Testes do Backend

O backend possui testes unitários para verificar a captura e o processamento de pacotes.

1. Rode os testes:  
    ```bash
    $env:PYTHONPATH = "$PWD"
    pytest tests/
    ```

2. Para ver detalhes mais verbosos:  
    ```bash
    pytest -v tests/
    ```

---

## 2. Frontend (Interface Visual)

O frontend exibe os dados capturados pelo backend.

### Passo 1: Navegar até a pasta do Frontend

```bash
    cd frontend
```

### Passo 2: Instalar Dependências

Se for a primeira vez rodando o projeto:
```bash
    npm install
```

### Passo 3: Iniciar a Aplicação Angular
```bash
    ng serve
```
### Passo 4: Acessar no Navegador

Abra o navegador e acesse:

http://localhost:4200/

A aplicação recarregará automaticamente se você alterar os arquivos.

### Passo 5: Executar Testes do Frontend

O frontend possui testes unitários com Jest ou Karma + Jasmine (dependendo do setup do Angular).

Rodar testes com Angular CLI:
```bash
ng test
```

Para rodar testes de cobertura:
```bash
ng test --code-coverage
```

Os resultados aparecerão no terminal e/ou abrirão uma janela do navegador mostrando os testes.

## 3. Observações Adicionais

Requisitos do Python:

- Python 3.11 ou superior

- Pacotes listados em requirements.txt

Requisitos do Frontend:

- Angular CLI 16+

Ambiente de Desenvolvimento:

É recomendável rodar backend e frontend em terminais separados para facilitar o desenvolvimento.

## 4. Estrutura de Pastas

O projeto é organizado da seguinte forma, separando claramente o backend e o frontend, com suas respectivas subpastas de responsabilidades:

```
Redes/
├── backend/                    # Código-fonte do backend (Python)
│   ├── app/                    # Módulos e lógica principal da aplicação
│   │   ├── controllers/      # Controladores (lógica de requisição/resposta)
│   │   ├── models/           # Modelos de dados e lógica de negócios
│   │   ├── routes/           # Definição das rotas da API
│   │   └── services/         # Serviços de negócio ou lógica de acesso a dados
│   ├── tests/                  # Testes unitários do backend (pytest)
│   └── run.py                  # Script principal para iniciar o servidor backend
│
└── frontend/                   # Código-fonte do frontend (Angular)
    ├── src/                    # Arquivos-fonte da aplicação Angular
    │   └── app/                # Módulo principal da aplicação
    │       ├── components/     # Componentes reutilizáveis da UI
    │       ├── models/         # Modelos/interfaces de dados do frontend
    │       └── services/       # Serviços (chamadas API, lógica de estado)
    ├── angular.json            # Arquivo de configuração do Angular CLI
    └── package.json            # Dependências e scripts do frontend (npm/yarn)
```

- **`backend/`**: Contém toda a lógica do servidor, responsável pela captura e processamento de pacotes de rede.
- **`frontend/`**: Contém a aplicação de interface do usuário desenvolvida com Angular, responsável por exibir os dados ao usuário.
