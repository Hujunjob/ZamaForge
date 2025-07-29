import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import AirdropABI from '../../abis/Airdrop.json';

// Airdrop合约地址（来自README.md）
const AIRDROP_CONTRACT_ADDRESS = '0x6dB435EFe22787b6CC4E0DDAb8a6281a8a6E04F1';
// ZamaForge合约地址（来自README.md）
const ZAMAFORGE_CONTRACT_ADDRESS = '0xdc5A3601541518A3B52879ef5F231f6A624C93EB';

export const useAirdrop = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  
  // 读取空投费用
  const { data: claimFee } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: AirdropABI,
    functionName: 'CLAIM_FEE',
  });

  // 读取空投数量
  const { data: claimAmount } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: AirdropABI,
    functionName: 'CLAIM_AMOUNT',
  });

  // 读取ZamaForge代币的decimals
  const { data: zamaForgeDecimals } = useReadContract({
    address: ZAMAFORGE_CONTRACT_ADDRESS,
    abi: [
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'decimals',
  });

  const claimTokens = async () => {
    if (!address || !claimFee) {
      throw new Error('钱包未连接或无法获取空投费用');
    }

    try {
      await writeContract({
        address: AIRDROP_CONTRACT_ADDRESS,
        abi: AirdropABI,
        functionName: 'claimTokens',
        args: [ZAMAFORGE_CONTRACT_ADDRESS],
        value: claimFee,
      });
    } catch (err) {
      console.error('Claim tokens error:', err);
      throw err;
    }
  };

  // 计算正确的显示数量（处理decimals）
  const getFormattedClaimAmount = () => {
    if (!claimAmount || zamaForgeDecimals === undefined) return 0;
    const decimals = Number(zamaForgeDecimals);
    const divisor = Math.pow(10, decimals);
    return Number(claimAmount) / divisor;
  };

  return {
    claimTokens,
    isPending,
    isSuccess,
    error,
    claimFee: claimFee ? Number(claimFee) : 0,
    claimAmount: getFormattedClaimAmount(),
    contractAddress: AIRDROP_CONTRACT_ADDRESS,
    zamaForgeAddress: ZAMAFORGE_CONTRACT_ADDRESS,
  };
};