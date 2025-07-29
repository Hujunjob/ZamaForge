import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { readContract } from '@wagmi/core';
import { sepolia } from 'wagmi/chains';
import ConfidentialTokenFactoryABI from '../../abis/ConfidentialTokenFactory.json';
import ConfidentialTokenWrapperABI from '../../abis/ConfidentialTokenWrapper.json';
import TestCoinABI from '../../abis/TestCoin.json';

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
    if (!address) throw new Error('钱包未连接');
    
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
    if (!address) throw new Error('钱包未连接');
    
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
    if (!address) throw new Error('钱包未连接');
    
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
    const allowance = checkAllowance(erc20Address);
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
  const getERC20Address = (confidentialTokenAddress: `0x${string}`) => {
    const { data: erc20Address } = useReadContract({
      address: FACTORY_CONTRACT_ADDRESS,
      abi: factoryAbi,
      functionName: 'getERC20',
      args: [confidentialTokenAddress],
    });
    
    return erc20Address;
  };

  // 检查ERC20代币授权额度
  const checkAllowance = (erc20Address: `0x${string}`) => {
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
    getERC20Address,
    checkAllowance,
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

  // 解包装加密代币为普通代币
  const unwrap = async (fromAddress: `0x${string}`, toAddress: `0x${string}`, encryptedAmount: string) => {
    if (!address) throw new Error('钱包未连接');
    
    try {
      writeContract({
        address: wrapperAddress,
        abi: wrapperAbi,
        functionName: 'unwrap',
        args: [fromAddress, toAddress, encryptedAmount],
        chain: sepolia,
        account: address,
      });
      
      return hash;
    } catch (error) {
      console.error('解包装加密代币失败:', error);
      throw error;
    }
  };

  // 加密转账
  const confidentialTransfer = async (toAddress: `0x${string}`, encryptedAmount: string) => {
    if (!address) throw new Error('钱包未连接');
    
    try {
      writeContract({
        address: wrapperAddress,
        abi: wrapperAbi,
        functionName: 'confidentialTransfer',
        args: [toAddress, encryptedAmount],
        chain: sepolia,
        account: address,
      });
      
      return hash;
    } catch (error) {
      console.error('加密转账失败:', error);
      throw error;
    }
  };

  // 查询加密余额
  const { data: confidentialBalance } = useReadContract({
    address: wrapperAddress,
    abi: wrapperAbi,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
  });

  return {
    unwrap,
    confidentialTransfer,
    confidentialBalance,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
};