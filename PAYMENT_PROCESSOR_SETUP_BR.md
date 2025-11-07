# Guia de Integração de Processadores de Pagamento para o Mercado Brasileiro

Este guia explica como configurar processadores de pagamento adequados para o mercado brasileiro, considerando métodos de pagamento locais como PIX, Boleto Bancário e cartões brasileiros.

## Visão Geral

O aplicativo agora inclui um modal de fundos (`FundingModal`) adaptado para o mercado brasileiro, que oferece múltiplas formas para usuários adicionarem fundos às suas contas inteligentes:

1. **Comprar Cripto** - Compra direta via cartão (BuyWidget Thirdweb) em BRL
2. **Transferir** - Transferências diretas de cripto para endereço da conta inteligente
3. **Bridge** - Opções de bridge cross-chain

## Configuração Atual: BuyWidget Thirdweb (BRL)

O componente `BuyWidget` da Thirdweb está configurado para aceitar pagamentos em Real Brasileiro (BRL) e já está traduzido para português.

### Requisitos de Configuração

1. **Dashboard Thirdweb**:
   - Acesse o [Dashboard Thirdweb](https://thirdweb.com/dashboard)
   - Ative o processamento de pagamentos nas configurações do seu app
   - Configure a moeda para BRL (já configurado no código)
   - Verifique se aceita cartões brasileiros

2. **Variáveis de Ambiente**:
   Certifique-se de ter estas variáveis no seu `.env.local`:
   ```bash
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=seu_client_id
   ```

3. **Configuração de Chain**:
   - Atualmente configurado para `baseSepolia` (testnet)
   - Para produção, altere para `base` mainnet:
   ```typescript
   import { base } from "thirdweb/chains";
   // Depois use: chain={base}
   ```

### Métodos de Pagamento Suportados

O BuyWidget suporta:
- Cartões de Crédito
- Cartões de Débito
- Apple Pay
- Google Pay

**Nota:** Para aceitar métodos específicos do Brasil (PIX, Boleto), você precisará integrar processadores brasileiros adicionais.

## Processadores de Pagamento Brasileiros Recomendados

### Opção 1: Mercado Pago / Mercado Livre

Mercado Pago é uma das principais plataformas de pagamento no Brasil, oferecendo suporte a PIX, Boleto e cartões.

**Integração Básica:**

```typescript
// Para PIX e Boleto, você precisará criar um endpoint no backend
// src/app/api/mercadopago/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { amount, address } = await request.json();
  
  // Criar preferência de pagamento no Mercado Pago
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: 'Fundos para Conta Inteligente',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_URL}/payment/failure`,
      },
      metadata: {
        recipient_address: address,
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
    }),
  });
  
  const preference = await response.json();
  return NextResponse.json({ init_point: preference.init_point });
}
```

**Variáveis de Ambiente:**
```bash
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_mercadopago
MERCADOPAGO_PUBLIC_KEY=sua_chave_publica_mercadopago
```

### Opção 2: Transfi (Ex-Banxa)

Transfi (anteriormente Banxa) oferece soluções de onramp para criptomoedas com suporte ao mercado brasileiro.

**Instalação:**
```bash
npm install @transfi/sdk
```

**Integração Básica:**
```typescript
import { Transfi } from '@transfi/sdk';

const handleTransfiPurchase = () => {
  const transfi = new Transfi({
    apiKey: process.env.NEXT_PUBLIC_TRANSFI_API_KEY!,
    environment: 'sandbox', // ou 'production'
  });
  
  transfi.open({
    walletAddress: account.address,
    sourceCurrency: 'BRL',
    sourceAmount: 100, // Valor em BRL
    targetCurrency: 'ETH',
    network: 'base', // Base network
  });
};
```

### Opção 3: PagBrasil

PagBrasil oferece integração completa com PIX, Boleto Bancário e cartões, ideal para o mercado brasileiro.

**Características:**
- PIX Automático para pagamentos recorrentes
- Boleto Bancário com desconto
- Suporte a cartões brasileiros
- API bem documentada

**Documentação:** https://docs.pagbrasil.com/

### Opção 4: EBANX

EBANX é especializado em pagamentos na América Latina e oferece excelente suporte para métodos brasileiros.

**Características:**
- PIX instantâneo
- Boleto Bancário
- Cartões de crédito locais
- Soluções específicas para o mercado brasileiro

**Documentação:** https://docs.ebanx.com/

### Opção 5: Integração Direta com PIX

Para maior controle, você pode integrar PIX diretamente através de uma instituição financeira ou gateway.

**Requisitos:**
- Conta em instituição financeira brasileira
- Certificado digital (A1 ou A3)
- API de PIX da instituição

**Exemplo com Banco do Brasil:**
```typescript
// Backend API route para criar QR Code PIX
export async function POST(request: Request) {
  const { amount, address } = await request.json();
  
  // Criar QR Code PIX dinâmico
  const pixData = {
    chave: process.env.PIX_KEY, // Sua chave PIX
    valor: amount.toFixed(2),
    descricao: `Fundos para conta ${address}`,
    // Outros campos necessários
  };
  
  // Usar SDK do banco ou API REST para gerar QR Code
  // Retornar QR Code para o frontend
}
```

## Considerações para Contas Inteligentes

Como você está usando account abstraction (contas inteligentes), considere:

1. **Patrocínio de Gas**: Seu app já patrocina gas (`sponsorGas: true`), então usuários não precisam de ETH para transações
2. **Transferências de Tokens**: Usuários podem receber tokens ERC-20 diretamente na conta inteligente
3. **Moeda Nativa**: Se usuários precisarem de ETH nativo, certifique-se de que recebam o suficiente (ou continue patrocinando gas)

## Checklist de Produção

Antes de ir para produção:

- [ ] Alterar de testnet para mainnet (chain base)
- [ ] Configurar chaves de API de produção para processadores de pagamento
- [ ] Testar todos os fluxos de pagamento extensivamente
- [ ] Configurar monitoramento de erros (Sentry, etc.)
- [ ] Configurar webhooks para confirmações de pagamento
- [ ] Configurar compliance/KYC se necessário (regulamentações brasileiras)
- [ ] Testar com métodos de pagamento reais (valores pequenos)
- [ ] Revisar estruturas de taxas e preços
- [ ] Implementar suporte a PIX e Boleto para melhor UX brasileira
- [ ] Configurar notificações em português para usuários

## Regulamentações Brasileiras

### Compliance

1. **CPF/CNPJ**: Pode ser necessário coletar informações fiscais dependendo do volume
2. **Central Bank Regulations**: Certifique-se de estar em conformidade com regulamentações do Banco Central
3. **LGPD**: Lei Geral de Proteção de Dados brasileira - implemente políticas de privacidade adequadas
4. **AML/KYC**: Anti-lavagem de dinheiro e conheça seu cliente - pode ser necessário dependendo do volume

### Métodos de Pagamento Populares no Brasil

1. **PIX** - Instantâneo, 24/7, sem custo para pessoas físicas
2. **Boleto Bancário** - Popular para pagamentos maiores
3. **Cartão de Crédito** - Parcelamento é muito comum
4. **Cartão de Débito** - Crescente com PIX

## Segurança e Melhores Práticas

1. **Nunca exponha chaves de API** no código do cliente
2. **Valide todas as transações** no servidor
3. **Implemente rate limiting** em endpoints de pagamento
4. **Use webhooks** para verificar status de pagamento
5. **Armazene logs de transações** para auditoria
6. **Implemente detecção de fraudes** adequada
7. **Criptografe dados sensíveis** (CPF, dados bancários)
8. **Conformidade com LGPD** - proteção de dados pessoais

## Testes

Para testar integrações de pagamento:

1. **Testnet**: Use tokens de testnet e modos sandbox dos processadores
2. **Cartões de Teste**: Use cartões de teste fornecidos pelos processadores
3. **Valores Pequenos**: Teste com valores mínimos primeiro
4. **Cenários de Erro**: Teste falhas e reversões
5. **PIX**: Use ambiente sandbox do banco para testar PIX

## Suporte e Documentação

Para questões ou dúvidas:
- Thirdweb Docs: https://portal.thirdweb.com
- Mercado Pago Docs: https://www.mercadopago.com.br/developers/pt/docs
- PagBrasil Docs: https://docs.pagbrasil.com/
- EBANX Docs: https://docs.ebanx.com/
- Banco Central - PIX: https://www.bcb.gov.br/estabilidadefinanceira/pix

## Implementação Recomendada para o Mercado Brasileiro

Para melhor experiência do usuário brasileiro, recomenda-se:

1. **Priorizar PIX** - Método mais rápido e popular
2. **Oferecer Boleto** - Para usuários que preferem ou não têm cartão
3. **Suportar Parcelamento** - Muito comum no Brasil
4. **Interface em Português** - Já implementado ✅
5. **Moeda em BRL** - Já configurado ✅
6. **Suporte ao Cliente** - Considere chat em português

## Próximos Passos Sugeridos

1. Integrar PIX via Mercado Pago ou PagBrasil
2. Adicionar suporte a Boleto Bancário
3. Implementar webhooks para confirmação automática
4. Adicionar notificações em português
5. Configurar ambiente de produção

