import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useZamaSDK } from '@/contexts/ZamaSDKContext';
import ConfidentialTokenWrapperABI from '../../abis/ConfidentialTokenWrapper.json';

// Type assertions for ABIs
const wrapperAbi = ConfidentialTokenWrapperABI as any;

interface UnwrapState {
  isUnwrapping: boolean;
  isEncrypting: boolean;
  error: string | null;
}

export const useUnwrapToken = () => {
  const { address } = useAccount();
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { initializeSDK } = useZamaSDK();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const [state, setState] = useState<UnwrapState>({
    isUnwrapping: false,
    isEncrypting: false,
    error: null,
  });

  // Unwrap confidential tokens to ERC20 (requires encryption)
  const unwrapConfidentialToken = async (
    wrapperAddress: `0x${string}`, 
    toAddress: `0x${string}`, 
    amount: number
  ) => {
    console.log('🔓 开始解包装加密代币:', { wrapperAddress, toAddress, amount, address });
    
    if (!address) {
      throw new Error('钱包未连接');
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
      
      // Convert amount to proper units (assuming 6 decimals for encrypted tokens)
      const amountInWei = amount * 1000000;
      console.log('💰 转换金额:', { amount, amountInWei: amountInWei.toString() });
      
      // Create encrypted input buffer
      console.log('🛡️ 创建加密输入缓冲区...');
      // Allow another UI update before heavy crypto operations
      await new Promise(resolve => setTimeout(resolve, 0));
      const buffer = fhevmInstance.createEncryptedInput(wrapperAddress, address);
      
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
      });
      
      console.log('📝 设置解包装状态为true');
      setState(prev => ({ ...prev, isEncrypting: false, isUnwrapping: true }));
      
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
      
      console.log('📞 准备调用unwrap:', {
        address: wrapperAddress,
        functionName: 'unwrap',
        args: [address, toAddress, handleValue, inputProofValue],
        chain: sepolia.name,
        account: address,
      });
      
      const txHash = await writeContractAsync({
        address: wrapperAddress,
        abi: wrapperAbi,
        functionName: 'unwrap',
        args: [address, toAddress, handleValue, inputProofValue],
        chain: sepolia,
        account: address,
      });
      
      console.log('✅ writeContractAsync调用成功，交易hash:', txHash);
      console.log('📝 设置解包装状态为false');
      setState(prev => ({ ...prev, isUnwrapping: false }));
      return txHash;
    } catch (error) {
      console.error('❌ 解包装失败:', error);
      setState(prev => ({ 
        ...prev, 
        isEncrypting: false,
        isUnwrapping: false, 
        error: '解包装失败' 
      }));
      throw error;
    }
  };

  return {
    unwrapConfidentialToken,
    isUnwrapping: state.isUnwrapping,
    isEncrypting: state.isEncrypting,
    isPending,
    isConfirming,
    isConfirmed,
    error: state.error,
    hash,
  };
};