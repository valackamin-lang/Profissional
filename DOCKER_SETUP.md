# Configuração do Docker

## Problema: Erro de Conexão com PostgreSQL e Redis

Se você está vendo erros como:
- `ECONNREFUSED` ao conectar no PostgreSQL
- `ECONNREFUSED` ao conectar no Redis
- `permission denied while trying to connect to the Docker daemon socket`

Isso significa que os serviços Docker não estão rodando ou você não tem permissões.

## Solução 1: Iniciar Docker com sudo

```bash
cd "/home/kali/Área de Trabalho/PROFESSIONAL"
sudo docker-compose up -d
```

## Solução 2: Adicionar usuário ao grupo docker (recomendado)

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente, ou executar:
newgrp docker

# Depois iniciar Docker normalmente
cd "/home/kali/Área de Trabalho/PROFESSIONAL"
docker-compose up -d
```

## Solução 3: Verificar se Docker está rodando

```bash
# Verificar status do Docker
sudo systemctl status docker

# Se não estiver rodando, iniciar:
sudo systemctl start docker

# Habilitar para iniciar automaticamente:
sudo systemctl enable docker
```

## Verificar se os serviços estão rodando

```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs postgres
docker-compose logs redis
```

## Comandos úteis

```bash
# Parar serviços
docker-compose down

# Parar e remover volumes (apaga dados)
docker-compose down -v

# Reiniciar serviços
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f
```

## Testar conexão manualmente

```bash
# Testar PostgreSQL
psql -h localhost -U forgetech_user -d forgetech_db
# Senha: forgetech_password

# Testar Redis
redis-cli -h localhost -p 6379
# Depois execute: PING (deve retornar PONG)
```

## Alternativa: Instalar PostgreSQL e Redis localmente

Se não quiser usar Docker, você pode instalar localmente:

### PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb forgetech_db
sudo -u postgres createuser forgetech_user
```

### Redis
```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

Depois atualize o arquivo `.env` com as configurações locais.
