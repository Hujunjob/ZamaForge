import { useAccount, useReadContract } from 'wagmi';
import TestCoinABI from '../../abis/TestCoin.json';

// TestCoin合约地址（来自README.md）
const TESTCOIN_CONTRACT_ADDRESS = '0xD659cfc0D1642aEc9aa7B3fbcd339B836A1b6d60';

export const useTestCoin = () => {
  const { address } = useAccount();
  
  // 读取TestCoin合约信息
  const { data: name, isLoading: nameLoading } = useReadContract({
    address: TESTCOIN_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'name',
  });

  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: TESTCOIN_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'symbol',
  });

  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    address: TESTCOIN_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'decimals',
  });

  const { data: totalSupply, isLoading: totalSupplyLoading } = useReadContract({
    address: TESTCOIN_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'totalSupply',
  });

  const { data: userBalance, isLoading: balanceLoading } = useReadContract({
    address: TESTCOIN_CONTRACT_ADDRESS,
    abi: TestCoinABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const isLoading = nameLoading || symbolLoading || decimalsLoading || totalSupplyLoading || balanceLoading;

  const getTestCoinInfo = () => {
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
      contractAddress: TESTCOIN_CONTRACT_ADDRESS,
      type: 'erc20' as const,
    };
  };

  return {
    testCoinInfo: getTestCoinInfo(),
    isLoading,
    contractAddress: TESTCOIN_CONTRACT_ADDRESS,
  };
};