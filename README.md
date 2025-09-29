# Guia de Inicialização do Projeto

Este guia mostra como configurar e executar o **backend** (captura de pacotes) e o **frontend** (interface visual) da aplicação.

## 🚀 Começando

Siga os passos abaixo para rodar o projeto localmente.

---

## 1. Backend (Captura de Dados)

O backend é responsável por capturar os pacotes de rede.

### Passo 1: Preparar o Ambiente

1. **Clone o repositório** (se ainda não fez):  
    ```bash
        git clone https://github.com/StefissonRafaelHonorato/Redes.git
        cd backend
    ```

2. **Crie um ambiente virtual** (recomendado):  
    ```bash
        python -m venv venv
        # Ative o ambiente:
        # Windows:
        venv\Scripts\activate
        # Linux/Mac:
        source venv/bin/activate
    ```

3. **Instale as dependências**:  
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

## 3. Observações Adicionais

Requisitos do Python:

- Python 3.10 ou superior

- Pacotes listados em requirements.txt

Requisitos do Frontend:

- Node.js 18+

- Angular CLI 16+

Ambiente de Desenvolvimento:

É recomendável rodar backend e frontend em terminais separados para facilitar o desenvolvimento.