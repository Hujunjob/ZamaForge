import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { sepolia } from 'wagmi/chains';
import { useZamaSDK } from '@/contexts/ZamaSDKContext';
import ConfidentialTokenWrapperABI from '../../abis/ConfidentialTokenWrapper.json';
import TestCoinABI from '../../abis/TestCoin.json';

// Type assertions for ABIs
const wrapperAbi = ConfidentialTokenWrapperABI as any;
const erc20Abi = TestCoinABI as any;

interface TransferState {
  isTransferring: boolean;
  isEncrypting: boolean;
  error: string | null;
}

export const useTokenTransfer = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { initializeSDK } = useZamaSDK();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const [state, setState] = useState<TransferState>({
    isTransferring: false,
    isEncrypting: false,
    error: null,
  });

  // Transfer ERC20 tokens
  const transferERC20 = async (
    tokenAddress: `0x${string}`, 
    toAddress: `0x${string}`, 
    amount: number
  ) => {
    if (!address) throw new Error('钱包未连接');
    
    try {
      setState(prev => ({ ...prev, isTransferring: true, error: null }));
      
      const amountInWei = parseEther(amount.toString());
      
      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress, amountInWei],
        chain: sepolia,
        account: address,
      });
      
      return hash;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isTransferring: false, 
        error: '转账失败' 
      }));
      console.error('ERC20转账失败:', error);
      throw error;
    }
  };

  // Transfer confidential tokens (requires encryption)
  const transferConfidential = async (
    tokenAddress: `0x${string}`, 
    toAddress: `0x${string}`, 
    amount: number
  ) => {
    if (!address) throw new Error('钱包未连接');
    
    try {
      setState(prev => ({ ...prev, isEncrypting: true, error: null }));
      
      // Initialize Zama SDK
      const fhevmInstance = await initializeSDK();
      
      // Convert amount to proper units (assuming 18 decimals)
      const amountInWei = parseEther(amount.toString());
      
      // Create encrypted input buffer
      const buffer = fhevmInstance.createEncryptedInput(tokenAddress, address);
      
      // Add the amount as uint64 (wei amount)
      buffer.add64(BigInt(amountInWei.toString()));
      
      // Encrypt the values and get ciphertexts
      const ciphertexts = await buffer.encrypt();
      
      setState(prev => ({ ...prev, isEncrypting: false, isTransferring: true }));
      
      writeContract({
        address: tokenAddress,
        abi: wrapperAbi,
        functionName: 'confidentialTransfer',
        args: [toAddress, ciphertexts.handles[0], ciphertexts.inputProof],
        chain: sepolia,
        account: address,
      });
      
      return hash;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isEncrypting: false,
        isTransferring: false, 
        error: '加密转账失败' 
      }));
      console.error('加密转账失败:', error);
      throw error;
    }
  };

  return {
    transferERC20,
    transferConfidential,
    isTransferring: state.isTransferring,
    isEncrypting: state.isEncrypting,
    isPending,
    isConfirming,
    isConfirmed,
    error: state.error,
    hash,
  };
};