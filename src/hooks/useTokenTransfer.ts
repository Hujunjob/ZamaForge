import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { sepolia } from 'wagmi/chains';
import { useZamaSDK } from '@/contexts/ZamaSDKContext';
import ConfidentialTokenWrapperABI from '../../abis/ConfidentialTokenWrapper.json';
import TestCoinABI from '../../abis/TestCoin.json';
import { getWalletNotConnectedError } from '@/utils/errors';

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
      throw new Error(getWalletNotConnectedError());
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
        error: 'Transfer failed' 
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
      throw new Error(getWalletNotConnectedError());
    }
    
    // Set encrypting state immediately and synchronously
    console.log('🔐 立即设置加密状态为true');
    setState(prev => ({ ...prev, isEncrypting: true, error: null }));
    
    try {
      // Allow React to update UI first by yielding to the event loop
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Initialize Zama SDK
      console.log('🚀 初始化Zama SDK...');
      const fhevmInstance = await initializeSDK();
      console.log('✅ Zama SDK初始化成功');
      
      // Convert amount to proper units (assuming 18 decimals)
      const amountInWei = (amount*1000000);
      console.log('💰 转换金额:', { amount, amountInWei: amountInWei.toString() });
      
      // Create encrypted input buffer
      console.log('🛡️ 创建加密输入缓冲区...');
      // Allow another UI update before heavy crypto operations
      await new Promise(resolve => setTimeout(resolve, 0));
      const buffer = fhevmInstance.createEncryptedInput(tokenAddress, address);
      
      // Add the amount as uint64 (wei amount)
      buffer.add64(BigInt(amountInWei));
      console.log('📦 添加金额到缓冲区:', BigInt(amountInWei.toString()).toString());
      
      // Encrypt the values and get ciphertexts
      console.log('🔐 开始加密...');
      // Allow UI update before the heavy encryption operation
      await new Promise(resolve => setTimeout(resolve, 0));
      const ciphertexts = await buffer.encrypt();

      console.log('✅ 加密完成:', {
        handles: ciphertexts.handles,
        inputProofLength: ciphertexts.inputProof.length,
        handleType: typeof ciphertexts.handles[0],
        handleValue: ciphertexts.handles[0],
        handleIsArray: Array.isArray(ciphertexts.handles[0]),
        handleIsUint8Array: ciphertexts.handles[0] instanceof Uint8Array,
        inputProofType: typeof ciphertexts.inputProof,
        inputProofIsArray: Array.isArray(ciphertexts.inputProof),
        inputProofIsUint8Array: ciphertexts.inputProof instanceof Uint8Array
      });
      
      console.log('📝 设置转账状态为true');
      setState(prev => ({ ...prev, isEncrypting: false, isTransferring: true }));
      
      // Convert handle to hex string if it's a Uint8Array
      const encryptedAmount = ciphertexts.handles[0];
      let handleValue: `0x${string}`;
      if (encryptedAmount instanceof Uint8Array) {
        handleValue = ('0x' + Array.from(encryptedAmount).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
      } else {
        handleValue = encryptedAmount as `0x${string}`;
      }
      
      // Convert inputProof to hex string if it's a Uint8Array
      const inputProof = ciphertexts.inputProof;
      let inputProofValue: `0x${string}`;
      if (inputProof instanceof Uint8Array) {
        inputProofValue = ('0x' + Array.from(inputProof).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
      } else {
        inputProofValue = inputProof as `0x${string}`;
      }
      
      console.log('📞 准备调用confidentialTransfer:', {
        address: tokenAddress,
        functionName: 'confidentialTransfer',
        args: [toAddress, handleValue, inputProofValue],
        chain: sepolia.name,
        account: address,
      });
      
      const txHash = await writeContractAsync({
        address: tokenAddress,
        abi: wrapperAbi,
        functionName: 'confidentialTransfer',
        args: [toAddress, handleValue, inputProofValue],
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
        error: 'Encrypted transfer failed' 
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