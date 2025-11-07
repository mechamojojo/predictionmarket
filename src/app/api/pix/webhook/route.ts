import { NextRequest, NextResponse } from "next/server";
import { mintTokensToAddress } from "../../utils/token-mint";

/**
 * Webhook do Mercado Pago para receber notificações de pagamento PIX
 * 
 * Fluxo:
 * 1. Usuário paga PIX
 * 2. Mercado Pago envia notificação para este endpoint
 * 3. Verificamos o pagamento
 * 4. Se aprovado, convertemos BRL para tokens e enviamos para a conta inteligente
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Mercado Pago envia diferentes tipos de notificações
    const type = data.type;
    const action = data.action;

    // Tipos de notificação do Mercado Pago
    // Mercado Pago pode enviar como data.id ou apenas id
    const paymentId = data.data?.id || data.id;
    
    if (type === "payment" && paymentId) {

      // Buscar detalhes do pagamento
      const paymentDetails = await fetchPaymentDetails(paymentId);
      
      if (!paymentDetails) {
        return NextResponse.json({ error: "Não foi possível buscar detalhes do pagamento" }, { status: 500 });
      }

      // Verificar se o pagamento foi aprovado
      if (paymentDetails.status === "approved") {
        const recipientAddress = paymentDetails.metadata?.recipient_address;
        const amountBRL = parseFloat(paymentDetails.metadata?.amount_brl || paymentDetails.transaction_amount);
        
        if (!recipientAddress) {
          console.error("Endereço do destinatário não encontrado no metadata");
          return NextResponse.json({ error: "Endereço não encontrado" }, { status: 400 });
        }

        // Converter BRL para tokens: 1 BRL = 1 Token
        // Arredondar para baixo (floor) para garantir número inteiro
        const tokenAmount = Math.floor(amountBRL).toString();

        console.log(`[PIX] Convertendo ${amountBRL} BRL para ${tokenAmount} tokens para ${recipientAddress}`);

        // Usar a mesma função compartilhada do claimToken
        // Não aguardamos confirmação aqui para responder rápido ao webhook
        const mintResult = await mintTokensToAddress(recipientAddress, tokenAmount, false);

        if (mintResult.success) {
          console.log(`[PIX] Tokens enviados com sucesso. Queue ID: ${mintResult.queueId}`);
          return NextResponse.json({
            success: true,
            message: "Tokens enviados com sucesso",
            queueId: mintResult.queueId,
            amountBRL,
            tokenAmount,
          });
        } else {
          console.error("[PIX] Erro ao enviar tokens:", mintResult.error);
          return NextResponse.json(
            { error: "Erro ao enviar tokens", details: mintResult.error },
            { status: 500 }
          );
        }
      } else {
        // Pagamento não aprovado ainda
        return NextResponse.json({
          success: true,
          message: "Pagamento recebido mas ainda não aprovado",
          status: paymentDetails.status,
        });
      }
    }

    // Outros tipos de notificação
    return NextResponse.json({
      success: true,
      message: "Notificação recebida",
      type,
      action,
    });
  } catch (error) {
    console.error("Erro ao processar webhook PIX:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Buscar detalhes do pagamento no Mercado Pago
 */
async function fetchPaymentDetails(paymentId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro ao buscar pagamento:", errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar detalhes do pagamento:", error);
    return null;
  }
}


/**
 * GET - Para verificação do webhook (Mercado Pago pode fazer GET antes de POST)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Webhook PIX está funcionando",
    timestamp: new Date().toISOString(),
  });
}

