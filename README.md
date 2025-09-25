# Guia de Inicialização do Projeto

Este guia mostra como configurar e executar o backend e o frontend da aplicação.

## 🚀 Começando

Siga os passos abaixo para rodar o projeto em sua máquina local.

### 1\. Backend (Captura de Dados)

O backend é responsável por capturar os pacotes de rede.

1.  **Encontre seu IP:** Abra o terminal (CMD ou PowerShell) e use o comando `ipconfig` para descobrir seu endereço **IPv4**.
2.  **Configure o Ambiente:** No arquivo `.env` da pasta do backend, cole o seu endereço IPv4 na variável `SERVER_IP`.
3.  **Inicie o Script:** Em um terminal, navegue até a pasta do backend e execute o comando para iniciar a captura:
    ```bash
    # Exemplo:
    python seu_script_de_captura.py
    ```
    **Importante:** Deixe este terminal aberto.

### 2\. Frontend (Interface Visual)

O frontend exibe os dados capturados pelo backend.

1.  **Navegue até a Pasta:** Abra um **novo terminal** e acesse a pasta do frontend.
2.  **Instale as Dependências:** Se for a primeira vez, execute o comando:
    ```bash
    npm install
    ```
3.  **Inicie o Servidor:** Para iniciar a aplicação, rode:
    ```bash
    ng serve
    ```
4.  **Acesse a Aplicação:** Abra seu navegador e acesse **`http://localhost:4200/`**. A aplicação recarregará automaticamente se você alterar os arquivos.