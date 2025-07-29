import { useAccount, useReadContract } from 'wagmi';
import TestCoinABI from '../../abis/TestCoin.json';

// ZamaForge合约地址（来自README.md）
const ZAMAFORGE_CONTRACT_ADDRESS = '0xdc5A3601541518A3B52879ef5F231f6A624C93EB';

export const useZamaForge = () => {
  const { address } = useAccount();
  
  // 读取ZamaForge合约信息
  const { data: name, isLoading: nameLoading } = useReadContract({
    address: ZAMAFORGE_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'name',
  });

  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: ZAMAFORGE_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'symbol',
  });

  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    address: ZAMAFORGE_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'decimals',
  });

  const { data: totalSupply, isLoading: totalSupplyLoading } = useReadContract({
    address: ZAMAFORGE_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'totalSupply',
  });

  const { data: userBalance, isLoading: balanceLoading } = useReadContract({
    address: ZAMAFORGE_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const isLoading = nameLoading || symbolLoading || decimalsLoading || totalSupplyLoading || balanceLoading;

  const getZamaForgeInfo = () => {
    if (isLoading || !name || !symbol || decimals === undefined) {
      return null;
    }

    const tokenDecimals = Number(decimals);
    const divisor = Math.pow(10, tokenDecimals);

    return {
      name: name as string,
      symbol: symbol as string,
      balance: userBalance ? Number(userBalance) / divisor : 0,
      totalSupply: totalSupply ? Number(totalSupply) / divisor : 0,
      contractAddress: ZAMAFORGE_CONTRACT_ADDRESS,
      type: 'erc20' as const,
    };
  };

  return {
    zamaForgeInfo: getZamaForgeInfo(),
    isLoading,
    contractAddress: ZAMAFORGE_CONTRACT_ADDRESS,
  };
};