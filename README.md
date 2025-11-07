# Megabolsa - Maior Bolsa de Opiniões do Brasil

Plataforma de mercado de previsões (prediction market) para o mercado brasileiro, permitindo que usuários apostem em eventos e ganhem créditos baseados em previsões corretas.

## 🚀 Funcionalidades

- **Mercados de Previsão**: Crie e participe de mercados sobre diversos temas
- **Depósito via PIX**: Adicione fundos à sua carteira através de PIX
- **Smart Wallets**: Integração com Thirdweb para carteiras inteligentes
- **Perfil de Usuário**: Acompanhe suas posições, ganhos e perdas
- **Gráficos de Probabilidade**: Visualize a evolução das probabilidades ao longo do tempo
- **Filtros e Busca**: Encontre mercados por categoria, volume ou data

## 🛠️ Tecnologias

- **Next.js 15**: Framework React
- **Thirdweb**: Integração com blockchain e smart wallets
- **Tailwind CSS**: Estilização
- **TypeScript**: Tipagem estática
- **Mercado Pago**: Processamento de pagamentos PIX

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Thirdweb
- Credenciais do Mercado Pago (para PIX)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd megabolsa
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=seu_client_id
BACKEND_WALLET_ADDRESS=seu_backend_wallet
ENGINE_URL=https://base-sepolia.thirdweb.com
THIRDWEB_SECRET_KEY=seu_secret_key

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token
MERCADOPAGO_PUBLIC_KEY=sua_public_key

# URL do app (para webhooks)
NEXT_PUBLIC_URL=http://localhost:3000
```

4. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

## 📦 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Acesse [Vercel](https://vercel.com)
3. Importe seu repositório
4. Configure as variáveis de ambiente
5. Deploy automático!

### Outras opções

- **Netlify**: Similar ao Vercel
- **Railway**: Boa opção para apps Next.js
- **Render**: Alternativa gratuita

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Cria build de produção
- `npm run start`: Inicia servidor de produção
- `npm run lint`: Executa o linter

## 🔐 Variáveis de Ambiente

Certifique-se de configurar todas as variáveis necessárias antes de fazer deploy. Veja `ENV_SETUP.md` para mais detalhes.

## 📄 Licença

Este projeto é privado.

## 🤝 Contribuindo

Este é um projeto privado. Para sugestões ou problemas, abra uma issue.
