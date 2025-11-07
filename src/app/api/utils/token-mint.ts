import { tokenAddress } from "@/constants/contract";

const { BACKEND_WALLET_ADDRESS, ENGINE_URL, THIRDWEB_SECRET_KEY } = process.env;

/**
 * Função compartilhada para verificar status de transação
 */
async function checkTransactionStatus(queueId: string): Promise<boolean> {
  if (!ENGINE_URL || !THIRDWEB_SECRET_KEY) {
    return false;
  }

  const statusResponse = await fetch(
    `${ENGINE_URL}/transaction/status/${queueId}`,
    {
      headers: {
        Authorization: `Bearer ${THIRDWEB_SECRET_KEY}`,
      },
    }
  );

  if (statusResponse.ok) {
    const statusData = await statusResponse.json();
    return statusData.result.status === "mined";
  }
  return false;
}

/**
 * Função compartilhada para aguardar confirmação da transação
 */
async function pollTransactionStatus(
  queueId: string,
  maxAttempts = 15,
  interval = 3000
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const isMined = await checkTransactionStatus(queueId);
    if (isMined) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}

/**
 * Função compartilhada para gerar tokens para um endereço
 * Usada tanto pelo claimToken quanto pelo webhook PIX
 * 
 * @param address - Endereço da conta inteligente que receberá os tokens
 * @param amount - Quantidade de tokens (em string, sem decimais)
 * @param waitForConfirmation - Se true, aguarda confirmação da transação
 * @returns Objeto com success, queueId e opcionalmente isMined
 */
export async function mintTokensToAddress(
  address: string,
  amount: string,
  waitForConfirmation: boolean = false
) {
  if (!BACKEND_WALLET_ADDRESS || !ENGINE_URL || !THIRDWEB_SECRET_KEY) {
    throw new Error('Server misconfigured. Variáveis de ambiente não configuradas.');
  }

  try {
    const resp = await fetch(
      `${ENGINE_URL}/contract/84532/${tokenAddress}/erc20/mint-to`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${THIRDWEB_SECRET_KEY}`,
          "x-backend-wallet-address": BACKEND_WALLET_ADDRESS,
        },
        body: JSON.stringify({
          toAddress: address,
          amount: amount,
        }),
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("[ERROR] Falha ao mint tokens:", errorText);
      return {
        success: false,
        error: errorText,
        queueId: null,
      };
    }

    const data = await resp.json();
    const queueId = data.result.queueId;

    if (waitForConfirmation) {
      const isMined = await pollTransactionStatus(queueId);
      return {
        success: true,
        queueId,
        isMined,
      };
    }

    return {
      success: true,
      queueId,
      isMined: null,
    };
  } catch (error) {
    console.error("[ERROR] Erro ao mint tokens:", error);
    return {
      success: false,
      error: String(error),
      queueId: null,
    };
  }
}

