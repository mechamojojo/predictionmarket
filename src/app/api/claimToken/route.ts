import { NextResponse } from "next/server";
import { mintTokensToAddress } from "../utils/token-mint";

const { BACKEND_WALLET_ADDRESS, ENGINE_URL, THIRDWEB_SECRET_KEY } = process.env;

/**
 * Endpoint para receber tokens manualmente (botão "Receber Tokens")
 * Mantém a funcionalidade original de dar 100 tokens fixos
 */
export async function POST(request: Request) {
  if (!BACKEND_WALLET_ADDRESS || !ENGINE_URL || !THIRDWEB_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Server misconfigured. Did you forget to add a ".env.local" file?' },
      { status: 500 }
    );
  }

  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address é obrigatório" },
        { status: 400 }
      );
    }

    // Gerar 100 tokens (como antes)
    const result = await mintTokensToAddress(address, "100", true);

    if (result.success && result.isMined) {
      return NextResponse.json({
        message: "Transaction mined successfully!",
        queueId: result.queueId,
      });
    } else if (result.success) {
      return NextResponse.json(
        {
          message: "Transaction not mined within the timeout period.",
          queueId: result.queueId,
        },
        { status: 408 }
      );
    } else {
      return NextResponse.json(
        { message: "Failed to initiate transaction", error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[ERROR] Erro no claimToken:", error);
    return NextResponse.json(
      { message: "Failed to initiate transaction", error: String(error) },
      { status: 500 }
    );
  }
}
