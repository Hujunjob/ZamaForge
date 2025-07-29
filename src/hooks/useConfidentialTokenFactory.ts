import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { readContract } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import ConfidentialTokenFactoryABI from '../../abis/ConfidentialTokenFactory.json';
import ConfidentialTokenWrapperABI from '../../abis/ConfidentialTokenWrapper.json';
import TestCoinABI from '../../abis/TestCoin.json';
import { getWalletNotConnectedError } from '@/utils/errors';

// Type assertions for ABIs
const factoryAbi = ConfidentialTokenFactoryABI as any;
const wrapperAbi = ConfidentialTokenWrapperABI as any;
const erc20Abi = TestCoinABI as any;

// ConfidentialTokenFactory合约地址
const FACTORY_CONTRACT_ADDRESS = '0x8d3F4e8fe379dBEA133420Eb6Be79033A0e78593' as const;

export const useConfidentialTokenFactory = () => {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // 状态管理
  const [currentStep, setCurrentStep] = useState<'idle' | 'checking' | 'approving' | 'wrapping'>('idle');

  // 授权ERC20代币给factory合约
  const approveERC20 = async (erc20Address: `0x${string}`, amount: number) => {
    if (!address) throw new Error(getWalletNotConnectedError());
    
    try {
      const amountInWei = parseEther(amount.toString());
      
      writeContract({
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [FACTORY_CONTRACT_ADDRESS, amountInWei],
        chain: sepolia,
        account: address,
      });
      
      return hash;
    } catch (error) {
      console.error('授权ERC20代币失败:', error);
      throw error;
    }
  };

  // 包装ERC20代币为加密代币（自动处理授权）
  const wrapERC20WithApproval = async (erc20Address: `0x${string}`, amount: number) => {
    if (!address) throw new Error(getWalletNotConnectedError());
    
    try {
      setCurrentStep('checking');
      const amountInWei = parseEther(amount.toString());
      
      // 使用 readContract 异步检查当前授权额度
      const allowance = await readContract(config, {
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, FACTORY_CONTRACT_ADDRESS],
      }) as bigint;
      
      console.log('当前授权额度:', allowance.toString(), '需要授权:', amountInWei.toString());
      
      // 如果授权不足，先进行授权
      if (allowance < amountInWei) {
        setCurrentStep('approving');
        console.log('授权额度不足，正在授权...');
        
        // 授权代币
        writeContract({
          address: erc20Address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [FACTORY_CONTRACT_ADDRESS, amountInWei],
          chain: sepolia,
          account: address,
        });
        
        return { needsApproval: true, step: 'approving' };
      }
      
      // 如果授权充足，直接进行转换
      setCurrentStep('wrapping');
      console.log('授权充足，正在转换...');
      
      writeContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: factoryAbi,
        functionName: 'wrapERC20',
        args: [erc20Address, amountInWei],
        chain: sepolia,
        account: address,
      });
      
      return { needsApproval: false, step: 'wrapping' };
      
    } catch (error) {
      setCurrentStep('idle');
      console.error('包装ERC20代币失败:', error);
      throw error;
    }
  };

  // 包装ERC20代币为加密代币（自动处理授权）
  const wrapERC20 = async (erc20Address: `0x${string}`, amount: number) => {
    if (!address) throw new Error(getWalletNotConnectedError());
    
    try {
      setCurrentStep('checking');
      const amountInWei = parseEther(amount.toString());
      
      // 检查当前授权额度
      const allowance = await readContract(config, {
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, FACTORY_CONTRACT_ADDRESS],
      }) as bigint;
      
      console.log('当前授权额度:', allowance.toString(), '需要授权:', amountInWei.toString());
      
      // 如果授权不足，先进行授权
      if (allowance < amountInWei) {
        setCurrentStep('approving');
        console.log('授权额度不足，正在授权...');
        
        writeContract({
          address: erc20Address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [FACTORY_CONTRACT_ADDRESS, amountInWei],
          chain: sepolia,
          account: address,
        });
        
        return { step: 'approving', message: '请等待授权交易完成，然后再次调用转换' };
      }
      
      // 如果授权充足，直接进行转换
      setCurrentStep('wrapping');
      console.log('授权充足，正在转换...');
      
      writeContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: factoryAbi,
        functionName: 'wrapERC20',
        args: [erc20Address, amountInWei],
        chain: sepolia,
        account: address,
      });
      
      return { step: 'wrapping', message: '正在转换代币' };
      
    } catch (error) {
      setCurrentStep('idle');
      console.error('包装ERC20代币失败:', error);
      throw error;
    }
  };

  // 异步检查是否有足够的授权额度
  const checkAllowanceAsync = async (erc20Address: `0x${string}`, amount: number) => {
    if (!address) return false;
    
    try {
      const amountInWei = parseEther(amount.toString());
      const allowance = await readContract(config, {
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, FACTORY_CONTRACT_ADDRESS],
      }) as bigint;
      
      return allowance >= amountInWei;
    } catch (error) {
      console.error('检查授权额度失败:', error);
      return false;
    }
  };

  // 检查是否有足够的授权额度（基于 useReadContract 的结果）
  const hasEnoughAllowance = (erc20Address: `0x${string}`, amount: number) => {
    const allowance = useAllowance(erc20Address);
    if (!allowance) return false;
    
    const amountInWei = parseEther(amount.toString());
    return (allowance as bigint) >= amountInWei;
  };

  // 获取ZamaForge代币对应的加密代币地址
  const ZAMAFORGE_CONTRACT_ADDRESS = '0xdc5A3601541518A3B52879ef5F231f6A624C93EB';
  const { data: confidentialTokenAddress } = useReadContract({
    address: FACTORY_CONTRACT_ADDRESS,
    abi: factoryAbi,
    functionName: 'getConfidentialToken',
    args: [ZAMAFORGE_CONTRACT_ADDRESS],
  });

  // 获取加密代币对应的普通代币地址
  const useERC20Address = (confidentialTokenAddress: `0x${string}`) => {
    const { data: erc20Address } = useReadContract({
      address: FACTORY_CONTRACT_ADDRESS,
      abi: factoryAbi,
      functionName: 'getERC20',
      args: [confidentialTokenAddress],
    });
    
    return erc20Address;
  };

  // 检查ERC20代币授权额度
  const useAllowance = (erc20Address: `0x${string}`) => {
    const { data: allowance } = useReadContract({
      address: erc20Address,
      abi: erc20Abi,
      functionName: 'allowance',
      args: address ? [address, FACTORY_CONTRACT_ADDRESS] : undefined,
    });
    
    return allowance;
  };

  return {
    approveERC20,
    wrapERC20,
    wrapERC20WithApproval,
    useERC20Address,
    useAllowance,
    checkAllowanceAsync,
    hasEnoughAllowance,
    confidentialTokenAddress,
    currentStep,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    contractAddress: FACTORY_CONTRACT_ADDRESS,
  };
};

// Hook for ConfidentialTokenWrapper operations
export const useConfidentialTokenWrapper = (wrapperAddress: `0x${string}`) => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // 解包装加密代币为普通代币 (需要加密金额)
  const unwrapWithEncryption = async (toAddress: `0x${string}`, amount: number, zamaSDK: any) => {
    if (!address) throw new Error(getWalletNotConnectedError());
    
    try {
      console.log('🔐 开始解包装加密代币:', { wrapperAddress, toAddress, amount, address });
      
      // Convert amount to proper units (assuming 6 decimals for encrypted tokens)
      const amountInWei = amount * 1000000;
      console.log('💰 转换金额:', { amount, amountInWei: amountInWei.toString() });
      
      // Create encrypted input buffer
      console.log('🛡️ 创建加密输入缓冲区...');
      const buffer = zamaSDK.createEncryptedInput(wrapperAddress, address);
      
      // Add the amount as uint64 (wei amount)
      buffer.add64(BigInt(amountInWei));
      console.log('📦 添加金额到缓冲区:', BigInt(amountInWei.toString()).toString());
      
      // Encrypt the values and get ciphertexts
      console.log('🔐 开始加密...');
      const ciphertexts = await buffer.encrypt();

      console.log('✅ 加密完成:', {
        handles: ciphertexts.handles,
        inputProofLength: ciphertexts.inputProof.length,
      });
      
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
      
      writeContract({
        address: wrapperAddress,
        abi: wrapperAbi,
        functionName: 'unwrap',
        args: [address, toAddress, handleValue, inputProofValue],
        chain: sepolia,
        account: address,
      });
      
      return hash;
    } catch (error) {
      console.error('解包装加密代币失败:', error);
      throw error;
    }
  };

  // 注意：加密转账功能已移至 useTokenTransfer hook
  // 这里不再提供 confidentialTransfer 方法，请使用 useTokenTransfer

  // 查询加密余额
  const { data: confidentialBalance } = useReadContract({
    address: wrapperAddress,
    abi: wrapperAbi,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
  });

  return {
    unwrapWithEncryption,
    confidentialBalance,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
};