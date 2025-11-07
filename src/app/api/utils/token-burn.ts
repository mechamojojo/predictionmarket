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
 * Função para queimar (burn) tokens de um endereço
 * Remove tokens do saldo do usuário permanentemente
 * 
 * @param fromAddress - Endereço da conta inteligente que terá os tokens queimados
 * @param amount - Quantidade de tokens para queimar (em string, sem decimais)
 * @param waitForConfirmation - Se true, aguarda confirmação da transação
 * @returns Objeto com success, queueId e opcionalmente isMined
 */
export async function burnTokensFromAddress(
  fromAddress: string,
  amount: string,
  waitForConfirmation: boolean = false
) {
  if (!BACKEND_WALLET_ADDRESS || !ENGINE_URL || !THIRDWEB_SECRET_KEY) {
    throw new Error('Server misconfigured. Variáveis de ambiente não configuradas.');
  }

  try {
    // Para queimar tokens, precisamos fazer uma transfer do usuário para o endereço zero (0x000...)
    // ou usar uma função burn se o contrato tiver
    // Vamos usar o método transfer para o endereço zero (burn padrão ERC20)
    const burnAddress = "0x0000000000000000000000000000000000000000";
    
    const resp = await fetch(
      `${ENGINE_URL}/contract/84532/${tokenAddress}/erc20/transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${THIRDWEB_SECRET_KEY}`,
          "x-backend-wallet-address": fromAddress, // Usuário precisa aprovar primeiro
        },
        body: JSON.stringify({
          toAddress: burnAddress,
          amount: amount,
        }),
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("[ERROR] Falha ao queimar tokens:", errorText);
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
    console.error("[ERROR] Erro ao queimar tokens:", error);
    return {
      success: false,
      error: String(error),
      queueId: null,
    };
  }
}

