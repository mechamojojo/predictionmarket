import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

export const contractAddress = "0xa2DD2F28dF06A76DdB817D2D16ce9f7036aB2945";
export const tokenAddress = "0xDA6EB77e8999Fd07D0E8443621C90ac1EDc7C259";

export const contract = getContract({
  client: client,
  chain: baseSepolia,
  address: contractAddress,
});

export const tokenContract = getContract({
  client: client,
  chain: baseSepolia,
  address: tokenAddress,
});
