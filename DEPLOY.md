# 🚀 Guia de Deploy - Megabolsa

## Passo 1: Fazer Push para o GitHub

Se você ainda não fez push das mudanças:

```bash
git add .
git commit -m "feat: atualização completa do megabolsa"
git push origin main
```

## Passo 2: Deploy no Vercel (Recomendado)

### Opção A: Via Interface Web

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New Project"
4. Importe o repositório `mechamojojo/predictionmarket`
5. Configure as variáveis de ambiente (veja abaixo)
6. Clique em "Deploy"

### Opção B: Via CLI

```bash
npm i -g vercel
vercel login
vercel
```

## Passo 3: Configurar Variáveis de Ambiente

No painel do Vercel, adicione estas variáveis de ambiente:

### Thirdweb
```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=seu_client_id
BACKEND_WALLET_ADDRESS=seu_backend_wallet
ENGINE_URL=https://base-sepolia.thirdweb.com
THIRDWEB_SECRET_KEY=seu_secret_key
```

### Mercado Pago
```
MERCADOPAGO_ACCESS_TOKEN=seu_access_token
MERCADOPAGO_PUBLIC_KEY=sua_public_key
```

### URL do App
```
NEXT_PUBLIC_URL=https://seu-app.vercel.app
```

⚠️ **IMPORTANTE**: Atualize a URL do webhook no Mercado Pago para:
```
https://seu-app.vercel.app/api/pix/webhook
```

## Passo 4: Configurar Webhook do Mercado Pago

1. Acesse o [Painel do Mercado Pago](https://www.mercadopago.com.br/developers)
2. Vá em "Webhooks" ou "Notificações"
3. Configure a URL: `https://seu-app.vercel.app/api/pix/webhook`
4. Salve as configurações

## Passo 5: Verificar Deploy

1. Acesse a URL fornecida pelo Vercel
2. Teste a conexão da carteira
3. Teste o depósito via PIX
4. Verifique se os webhooks estão funcionando

## 🔧 Troubleshooting

### Erro de Build
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique os logs do build no Vercel

### Webhook não funciona
- Verifique se a URL está correta no Mercado Pago
- Verifique os logs do Vercel para ver requisições recebidas
- Certifique-se de que a URL é HTTPS

### Erro de CORS
- O Vercel já configura CORS automaticamente
- Se houver problemas, verifique as configurações do Thirdweb

## 📝 Próximos Passos

Após o deploy:
1. Teste todas as funcionalidades
2. Compartilhe o link com seus amigos para testes
3. Monitore os logs para identificar problemas
4. Configure domínio personalizado (opcional)

