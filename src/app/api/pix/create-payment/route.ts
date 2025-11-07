import { NextRequest, NextResponse } from "next/server";
import { tokenAddress } from "@/constants/contract";

const {
  BACKEND_WALLET_ADDRESS,
  ENGINE_URL,
  THIRDWEB_SECRET_KEY,
  MERCADOPAGO_ACCESS_TOKEN,
} = process.env;

/**
 * API Route para criar pedido de pagamento PIX
 *
 * Fluxo:
 * 1. Usuário solicita adicionar fundos via PIX
 * 2. Esta API cria um pedido no Mercado Pago
 * 3. Retorna QR Code PIX e ID do pedido
 * 4. Usuário paga via PIX
 * 5. Webhook confirma pagamento e envia tokens automaticamente
 */
export async function POST(request: NextRequest) {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Mercado Pago não configurado. Adicione MERCADOPAGO_ACCESS_TOKEN no .env.local",
      },
      { status: 500 }
    );
  }

  try {
    const { amount, recipientAddress } = await request.json();

    if (!amount || !recipientAddress) {
      return NextResponse.json(
        { error: "Amount e recipientAddress são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar valor mínimo
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      return NextResponse.json(
        { error: "Valor mínimo é R$ 0,01" },
        { status: 400 }
      );
    }

    // Preparar URL de notificação
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    // Remover barra final se houver e garantir formato correto
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const notificationUrl = `${cleanBaseUrl}/api/pix/webhook`;

    // Validar se a URL é válida
    try {
      new URL(notificationUrl);
    } catch (e) {
      console.error("[PIX] URL de notificação inválida:", notificationUrl);
      return NextResponse.json(
        {
          error:
            "URL de notificação inválida. Configure NEXT_PUBLIC_URL no .env com uma URL válida (ex: https://seu-dominio.com ou use ngrok para desenvolvimento).",
          invalidUrl: notificationUrl,
        },
        { status: 400 }
      );
    }

    // Criar pagamento PIX diretamente no Mercado Pago
    const paymentPayload: any = {
      transaction_amount: amountNum,
      description: "Fundos para Megabolsa",
      payment_method_id: "pix",
      payer: {
        email: "user@megabolsa.com", // Email pode ser genérico para PIX
      },
      metadata: {
        recipient_address: recipientAddress,
        amount_brl: amount.toString(),
        conversion_rate: "1",
      },
    };

    // Adicionar notification_url apenas se não for localhost (ou se for via ngrok/https)
    // Mercado Pago pode rejeitar localhost, então podemos omitir em desenvolvimento
    if (
      notificationUrl.startsWith("https://") ||
      notificationUrl.includes("ngrok")
    ) {
      paymentPayload.notification_url = notificationUrl;
    } else {
      // Em desenvolvimento local sem ngrok, podemos omitir o webhook
      // O polling no frontend vai verificar o status
      console.log(
        "[PIX] Desenvolvimento local detectado. Webhook omitido. Use polling para verificar status."
      );
    }

    console.log(
      "[PIX] Criando pagamento com payload:",
      JSON.stringify(paymentPayload, null, 2)
    );

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `${recipientAddress}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const responseText = await mpResponse.text();
    console.log("[PIX] Status da resposta:", mpResponse.status);
    console.log("[PIX] Resposta do Mercado Pago:", responseText);

    if (!mpResponse.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = responseText;
      }

      console.error("[PIX] Erro ao criar pagamento:", errorDetails);

      // Mensagens de erro mais amigáveis
      let errorMessage = "Erro ao criar pedido PIX";
      if (errorDetails.message) {
        errorMessage = errorDetails.message;
      } else if (typeof errorDetails === "string") {
        errorMessage = errorDetails;
      } else if (errorDetails.cause && Array.isArray(errorDetails.cause)) {
        errorMessage = errorDetails.cause
          .map((c: any) => c.description || c.message)
          .join(", ");
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          statusCode: mpResponse.status,
        },
        { status: mpResponse.status || 500 }
      );
    }

    let payment;
    try {
      payment = JSON.parse(responseText);
    } catch (e) {
      console.error("[PIX] Erro ao parsear resposta:", e);
      return NextResponse.json(
        { error: "Resposta inválida do Mercado Pago", details: responseText },
        { status: 500 }
      );
    }

    // Verificar se o QR Code foi gerado
    const qrCode = payment.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 =
      payment.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode && !qrCodeBase64) {
      console.error("[PIX] QR Code não encontrado na resposta:", payment);
      return NextResponse.json(
        {
          error:
            "QR Code não foi gerado. Verifique se sua conta do Mercado Pago tem chave PIX cadastrada.",
          paymentData: payment,
        },
        { status: 500 }
      );
    }

    // Retornar QR Code e ID do pagamento
    return NextResponse.json({
      qrCode: qrCode,
      qrCodeBase64: qrCodeBase64,
      paymentId: payment.id,
      preferenceId: payment.id, // Para compatibilidade
      amount: amount,
      recipientAddress: recipientAddress,
      status: payment.status || "pending",
    });
  } catch (error) {
    console.error("Erro ao processar pedido PIX:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - Consultar status de um pedido PIX
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const preferenceId = searchParams.get("preferenceId");

  if (!preferenceId || !MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "preferenceId é obrigatório" },
      { status: 400 }
    );
  }

  try {
    // Buscar pagamentos associados a esta preferência
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?preference_id=${preferenceId}`,
      {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar status" },
        { status: 500 }
      );
    }

    const payments = await paymentResponse.json();
    const payment = payments.results?.[0];

    return NextResponse.json({
      status: payment?.status || "pending",
      paymentId: payment?.id,
      statusDetail: payment?.status_detail,
    });
  } catch (error) {
    console.error("Erro ao consultar status:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status" },
      { status: 500 }
    );
  }
}
