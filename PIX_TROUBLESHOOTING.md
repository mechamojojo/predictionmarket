# Troubleshooting - Erro ao Criar Pedido PIX

## Erros Comuns e Soluções

### 1. "Mercado Pago não configurado"
**Solução:**
- Verifique se `MERCADOPAGO_ACCESS_TOKEN` está no arquivo `.env`
- Reinicie o servidor após adicionar a variável

### 2. "QR Code não foi gerado"
**Causa:** Conta do Mercado Pago não tem chave PIX cadastrada

**Solução:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em "Suas integrações" → "Credenciais"
3. Verifique se há uma chave PIX cadastrada
4. Se não houver, cadastre uma chave PIX na sua conta do Mercado Pago

### 3. "Amount e recipientAddress são obrigatórios"
**Causa:** Dados não estão sendo enviados corretamente

**Solução:**
- Verifique se o usuário está conectado com a carteira
- Verifique se o valor está sendo inserido corretamente

### 4. Erro 401 (Unauthorized)
**Causa:** Access Token inválido ou expirado

**Solução:**
- Verifique se o token está correto no `.env`
- Gere um novo token no dashboard do Mercado Pago
- Certifique-se de usar o token de TESTE para desenvolvimento

### 5. Erro 400 (Bad Request)
**Causa:** Estrutura do payload incorreta

**Solução:**
- Verifique os logs do servidor para ver o erro específico
- Certifique-se de que o valor é um número válido
- Verifique se todas as variáveis de ambiente estão configuradas

### 6. "Valor mínimo é R$ 0,01"
**Solução:**
- Use um valor maior ou igual a R$ 0,01

## Como Verificar os Logs

### No Terminal (servidor)
```bash
# Os logs mostrarão:
[PIX] Criando pagamento com payload: {...}
[PIX] Status da resposta: 200/400/401/etc
[PIX] Resposta do Mercado Pago: {...}
```

### No Console do Navegador
- Abra DevTools (F12)
- Vá na aba Console
- Procure por erros que começam com "[PIX]"

## Checklist de Verificação

- [ ] `MERCADOPAGO_ACCESS_TOKEN` está no `.env`
- [ ] Token é válido (não expirado)
- [ ] Conta do Mercado Pago tem chave PIX cadastrada
- [ ] Valor inserido é maior que R$ 0,01
- [ ] Usuário está conectado com a carteira
- [ ] Servidor foi reiniciado após mudanças no `.env`

## Testando com Credenciais de Teste

Se estiver usando credenciais de TESTE:
- Use valores pequenos (ex: R$ 1,00)
- O QR Code será gerado, mas não funcionará para pagamento real
- Para testar pagamento, use o ambiente sandbox do Mercado Pago

## Próximos Passos

Se o erro persistir:
1. Verifique os logs detalhados no terminal
2. Copie a mensagem de erro completa
3. Verifique a documentação do Mercado Pago
4. Entre em contato com o suporte do Mercado Pago se necessário

