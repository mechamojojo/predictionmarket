# Integração PIX - Guia de Configuração

## 🎯 Solução Implementada

Sua aplicação agora possui uma integração completa de PIX que permite:

1. ✅ Usuários gerarem QR Code PIX com valor em BRL
2. ✅ Pagamento via PIX (instantâneo, 24/7)
3. ✅ Conversão automática de BRL para tokens
4. ✅ Envio automático de tokens para a conta inteligente do usuário

## 📋 Fluxo Completo

```
1. Usuário → Clica em "Adicionar Fundos" → Aba "PIX"
2. Usuário → Insere valor em BRL (ex: R$ 50,00)
3. Sistema → Gera QR Code PIX via Mercado Pago
4. Usuário → Escaneia QR Code ou copia código PIX
5. Usuário → Paga via app do banco
6. Mercado Pago → Envia webhook para /api/pix/webhook
7. Sistema → Verifica pagamento e converte BRL → Tokens
8. Sistema → Envia tokens para conta inteligente do usuário
9. Usuário → Recebe tokens automaticamente na conta
```

## 🔧 Configuração Necessária

### 1. Criar Conta no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers
2. Crie uma conta de desenvolvedor
3. Obtenha suas credenciais (Access Token)

### 2. Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto com:

```bash
# Mercado Pago - Credenciais de TESTE (já fornecidas)
MERCADOPAGO_ACCESS_TOKEN=TEST-33377079084827-110517-418ae461858b1883287b70aea67f036d-1064627213
MERCADOPAGO_PUBLIC_KEY=TEST-e0a2444b-1093-46f5-bda6-e6c27dfe2d38

# Thirdweb (substitua pelos seus valores)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=seu_client_id
BACKEND_WALLET_ADDRESS=seu_backend_wallet
ENGINE_URL=https://base-sepolia.thirdweb.com
THIRDWEB_SECRET_KEY=seu_secret_key

# URL do seu app (para webhooks)
# Para desenvolvimento local, use ngrok: NEXT_PUBLIC_URL=https://seu-ngrok-url.ngrok.io
NEXT_PUBLIC_URL=http://localhost:3000
```

**✅ Credenciais do Mercado Pago já configuradas!** Você só precisa:
1. Criar o arquivo `.env.local` com o conteúdo acima
2. Substituir os valores de Thirdweb pelos seus valores reais
3. Configurar ngrok para webhooks em desenvolvimento

### 3. Configurar Webhook

O Mercado Pago precisa acessar seu webhook. Para desenvolvimento local:

**Opção 1: Usar ngrok**
```bash
ngrok http 3000
# Use a URL gerada em NEXT_PUBLIC_URL
```

**Opção 2: Usar Cloudflare Tunnel ou similar**

**Opção 3: Configurar webhook no dashboard do Mercado Pago**
- Vá em: https://www.mercadopago.com.br/developers/panel/app
- Configure a URL do webhook: `https://seu-dominio.com/api/pix/webhook`

## 💰 Conversão BRL → Tokens

Atualmente configurado como **1 BRL = 1 Token**.

Para ajustar a taxa de conversão, edite:
- `src/app/api/pix/create-payment/route.ts` (linha 76)
- `src/app/api/pix/webhook/route.ts` (linha ~50)

**Exemplo para usar taxa de câmbio real:**
```typescript
// Buscar taxa de câmbio de uma API
const exchangeRate = await fetchExchangeRate('BRL', 'USD');
const tokenAmount = Math.floor(amountBRL * exchangeRate * tokensPerUSD);
```

## 🧪 Testando

### Ambiente Sandbox

1. Use credenciais de teste do Mercado Pago
2. Para testar pagamento:
   - Use CPF de teste: 12345678909
   - Mercado Pago fornece QR Codes de teste

### Teste Manual

1. Inicie o servidor: `npm run dev`
2. Conecte sua carteira
3. Clique em "Adicionar Fundos" → Aba "PIX"
4. Insira um valor (ex: R$ 10,00)
5. QR Code será gerado
6. Use app de teste ou simule pagamento
7. Verifique logs do webhook

## 📝 Arquivos Criados

1. **`src/app/api/pix/create-payment/route.ts`**
   - Cria pedido PIX
   - Gera QR Code
   - Retorna dados para frontend

2. **`src/app/api/pix/webhook/route.ts`**
   - Recebe notificações do Mercado Pago
   - Verifica pagamento
   - Converte BRL → Tokens
   - Envia tokens para conta inteligente

3. **`src/components/pix-payment.tsx`**
   - Componente React para interface PIX
   - Exibe QR Code
   - Polling de status
   - Feedback visual

4. **`src/components/funding-modal.tsx`** (atualizado)
   - Adicionada aba "PIX"
   - Integrado componente PixPayment

## 🔒 Segurança

### Implementado:
- ✅ Validação de dados no backend
- ✅ Webhook verificado pelo Mercado Pago
- ✅ Idempotência nas requisições
- ✅ Metadata seguro (endereço do usuário)

### Recomendações:
- 🔐 Use HTTPS em produção
- 🔐 Valide signature do webhook (Mercado Pago permite)
- 🔐 Implemente rate limiting
- 🔐 Logs de auditoria
- 🔐 Monitoramento de transações

## 🚀 Alternativas ao Mercado Pago

Se preferir outras soluções:

### 1. PagBrasil
- Especializado em PIX
- API similar
- Boa documentação

### 2. EBANX
- Bom para LATAM
- Suporte a PIX
- API bem documentada

### 3. Stripe (Brasil)
- Suporta PIX
- Interface familiar
- Boa para internacionalização

### 4. Integração Direta com Banco
- Mais complexo
- Requer certificado digital
- Maior controle

## 📊 Monitoramento

### Logs Importantes:
- Criação de pedidos PIX
- Recebimento de webhooks
- Conversão BRL → Tokens
- Envio de tokens
- Erros e falhas

### Métricas Úteis:
- Taxa de conversão (PIX pago → Tokens enviados)
- Tempo médio de confirmação
- Valor médio por transação
- Taxa de erro

## ⚠️ Troubleshooting

### QR Code não aparece
- Verifique `MERCADOPAGO_ACCESS_TOKEN`
- Confira logs do servidor
- Verifique formato da resposta da API

### Webhook não recebe notificações
- Verifique URL pública (use ngrok em dev)
- Confirme configuração no dashboard Mercado Pago
- Verifique logs do servidor

### Tokens não são enviados
- Verifique variáveis Thirdweb (ENGINE_URL, etc.)
- Confirme endereço do backend wallet
- Verifique logs do webhook

### Conversão incorreta
- Ajuste `conversion_rate` nas APIs
- Verifique cálculos
- Confirme taxa de câmbio

## 📚 Documentação Útil

- Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
- Thirdweb: https://portal.thirdweb.com
- PIX Banco Central: https://www.bcb.gov.br/estabilidadefinanceira/pix

## 🎉 Próximos Passos

1. ✅ Configurar credenciais Mercado Pago
2. ✅ Testar em sandbox
3. ✅ Configurar webhook público
4. ✅ Ajustar taxa de conversão
5. ✅ Testar fluxo completo
6. ✅ Deploy em produção
7. ✅ Monitorar transações

## 💡 Melhorias Futuras

- [ ] Dashboard de transações PIX
- [ ] Histórico de pagamentos
- [ ] Notificações push quando tokens chegam
- [ ] Suporte a múltiplas taxas de conversão
- [ ] Integração com outros processadores
- [ ] Suporte a Boleto Bancário

