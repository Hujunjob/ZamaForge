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
  const { writeContract, writeContractAsync, data: hash, isPending } = useWriteContract();
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
    console.log('🚀 开始ERC20转账:', { tokenAddress, toAddress, amount, address });
    
    if (!address) {
      console.error('❌ 钱包未连接');
      throw new Error('钱包未连接');
    }
    
    try {
      console.log('📝 设置转账状态为true');
      setState(prev => ({ ...prev, isTransferring: true, error: null }));
      
      const amountInWei = parseEther(amount.toString());
      console.log('💰 转换金额:', { amount, amountInWei: amountInWei.toString() });
      
      console.log('📞 准备调用writeContract:', {
        address: tokenAddress,
        functionName: 'transfer',
        args: [toAddress, amountInWei.toString()],
        chain: sepolia.name,
        account: address,
      });
      
      const txHash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress, amountInWei],
        chain: sepolia,
        account: address,
      });
      
      console.log('✅ writeContractAsync调用成功，交易hash:', txHash);
      console.log('📝 设置转账状态为false');
      setState(prev => ({ ...prev, isTransferring: false }));
      return txHash;
    } catch (error) {
      console.error('❌ ERC20转账失败:', error);
      setState(prev => ({ 
        ...prev, 
        isTransferring: false, 
        error: '转账失败' 
      }));
      throw error;
    }
  };

  // Transfer confidential tokens (requires encryption)
  const transferConfidential = async (
    tokenAddress: `0x${string}`, 
    toAddress: `0x${string}`, 
    amount: number
  ) => {
    console.log('🔐 开始加密代币转账:', { tokenAddress, toAddress, amount, address });
    
    if (!address) {
      console.error('❌ 钱包未连接');
      throw new Error('钱包未连接');
    }
    
    try {
      console.log('🔐 设置加密状态为true');
      setState(prev => ({ ...prev, isEncrypting: true, error: null }));
      
      // Initialize Zama SDK
      console.log('🚀 初始化Zama SDK...');
      const fhevmInstance = await initializeSDK();
      console.log('✅ Zama SDK初始化成功');
      
      // Convert amount to proper units (assuming 18 decimals)
      const amountInWei = parseEther(amount.toString());
      console.log('💰 转换金额:', { amount, amountInWei: amountInWei.toString() });
      
      // Create encrypted input buffer
      console.log('🛡️ 创建加密输入缓冲区...');
      const buffer = fhevmInstance.createEncryptedInput(tokenAddress, address);
      
      // Add the amount as uint64 (wei amount)
      buffer.add64(BigInt(amountInWei.toString()));
      console.log('📦 添加金额到缓冲区:', BigInt(amountInWei.toString()).toString());
      
      // Encrypt the values and get ciphertexts
      console.log('🔐 开始加密...');
      const ciphertexts = await buffer.encrypt();
      console.log('✅ 加密完成:', {
        handles: ciphertexts.handles,
        inputProofLength: ciphertexts.inputProof.length,
        handleType: typeof ciphertexts.handles[0],
        handleValue: ciphertexts.handles[0],
        inputProofType: typeof ciphertexts.inputProof,
        inputProofValue: ciphertexts.inputProof
      });
      
      console.log('📝 设置转账状态为true');
      setState(prev => ({ ...prev, isEncrypting: false, isTransferring: true }));
      
      console.log('📞 准备调用confidentialTransfer:', {
        address: tokenAddress,
        functionName: 'confidentialTransfer',
        args: [toAddress, ciphertexts.handles[0], `inputProof(${ciphertexts.inputProof.length} bytes)`],
        chain: sepolia.name,
        account: address,
      });
      
      const txHash = await writeContractAsync({
        address: tokenAddress,
        abi: wrapperAbi,
        functionName: 'confidentialTransfer',
        args: [toAddress, ciphertexts.handles[0], ciphertexts.inputProof],
        chain: sepolia,
        account: address,
      });
      
      console.log('✅ writeContractAsync调用成功，交易hash:', txHash);
      console.log('📝 设置转账状态为false');
      setState(prev => ({ ...prev, isTransferring: false }));
      return txHash;
    } catch (error) {
      console.error('❌ 加密转账失败:', error);
      setState(prev => ({ 
        ...prev, 
        isEncrypting: false,
        isTransferring: false, 
        error: '加密转账失败' 
      }));
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