# Configuração de Variáveis de Ambiente

## ⚠️ IMPORTANTE: Criar arquivo .env.local manualmente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```bash
# Mercado Pago - Credenciais de Teste
MERCADOPAGO_ACCESS_TOKEN=TEST-33377079084827-110517-418ae461858b1883287b70aea67f036d-1064627213
MERCADOPAGO_PUBLIC_KEY=TEST-e0a2444b-1093-46f5-bda6-e6c27dfe2d38

# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=seu_client_id_aqui
BACKEND_WALLET_ADDRESS=seu_backend_wallet_address_aqui
ENGINE_URL=https://base-sepolia.thirdweb.com
THIRDWEB_SECRET_KEY=seu_secret_key_aqui

# URL da aplicação (para webhooks)
# Para desenvolvimento local, use ngrok: NEXT_PUBLIC_URL=https://seu-ngrok-url.ngrok.io
NEXT_PUBLIC_URL=http://localhost:3000
```

## 📝 Passos para Configurar

1. **Criar arquivo `.env.local`** na raiz do projeto
2. **Copiar o conteúdo acima** para o arquivo
3. **Substituir os valores de Thirdweb** pelos seus valores reais:
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`: Obtenha em https://thirdweb.com/dashboard
   - `BACKEND_WALLET_ADDRESS`: Endereço da sua carteira backend
   - `THIRDWEB_SECRET_KEY`: Secret key do Thirdweb
4. **Para desenvolvimento local com webhooks**, configure ngrok:
   ```bash
   ngrok http 3000
   # Use a URL gerada em NEXT_PUBLIC_URL
   ```

## ✅ Credenciais Mercado Pago Configuradas

As credenciais do Mercado Pago (TESTE) já estão prontas:
- ✅ Access Token configurado
- ✅ Public Key configurado (para uso futuro no frontend se necessário)

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env.local` no git
- ✅ O arquivo `.gitignore` já está configurado para ignorar `.env*`
- ✅ As credenciais de TESTE são seguras para desenvolvimento
- ⚠️ Para produção, use credenciais de produção do Mercado Pago

## 🧪 Testando

Após configurar o `.env.local`:

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Teste a integração PIX:
   - Conecte sua carteira
   - Clique em "Adicionar Fundos" → Aba "PIX"
   - Insira um valor (ex: R$ 10,00)
   - O QR Code PIX deve ser gerado

## 📚 Documentação Adicional

- Ver `PIX_INTEGRATION_GUIDE.md` para guia completo
- Ver `.env.example` para template (se criado)

