import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';

interface DecryptionState {
  isDecrypting: boolean;
  error: string | null;
}

export const useZamaDecryption = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [state, setState] = useState<DecryptionState>({
    isDecrypting: false,
    error: null,
  });
  const [isSDKInitialized, setIsSDKInitialized] = useState(false);
  const [instance, setInstance] = useState<any>(null);

  // Initialize SDK and create instance
  const initializeSDK = useCallback(async () => {
    if (isSDKInitialized && instance) {
      return instance;
    }
    console.log("initializeSDK");
    
    try {
      setState(prev => ({ ...prev, isDecrypting: true, error: null }));
      
      // Initialize the SDK
      await initSDK();
      
      // Create instance with Sepolia config
      const config = { 
        ...SepoliaConfig, 
        network: window.ethereum 
      };
      const fhevmInstance = await createInstance(config);
      
      setInstance(fhevmInstance);
      setIsSDKInitialized(true);
      
      setState(prev => ({ ...prev, isDecrypting: false }));
      return fhevmInstance;
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      setState(prev => ({ 
        ...prev, 
        isDecrypting: false, 
        error: '初始化SDK失败' 
      }));
      throw error;
    }
  }, [isSDKInitialized, instance]);

  // Decrypt encrypted balance
  const decryptBalance = useCallback(async (
    ciphertextHandle: string,
    contractAddress: string
  ): Promise<string> => {
    if (!address || !walletClient) {
      throw new Error('钱包未连接');
    }

    try {
      setState(prev => ({ ...prev, isDecrypting: true, error: null }));

      // Initialize SDK if not already initialized
      const fhevmInstance = await initializeSDK();

      // Generate keypair for decryption
      const keypair = fhevmInstance.generateKeypair();
      
      // Prepare handle-contract pairs
      const handleContractPairs = [
        {
          handle: ciphertextHandle,
          contractAddress: contractAddress,
        },
      ];
      
      // Set duration for decryption request (10 days)
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [contractAddress];

      // Create EIP712 signature data
      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      // Sign the decryption request
      const signature = await walletClient.signTypedData({
        account: address,
        domain: eip712.domain,
        types: {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        primaryType: 'UserDecryptRequestVerification',
        message: eip712.message,
      });

      // Perform user decryption
      const result = await fhevmInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      const decryptedValue = result[ciphertextHandle];
      setState(prev => ({ ...prev, isDecrypting: false }));
      
      return decryptedValue?.toString() || '0';
    } catch (error) {
      console.error('解密失败:', error);
      setState(prev => ({ 
        ...prev, 
        isDecrypting: false, 
        error: '解密失败，请重试' 
      }));
      throw error;
    }
  }, [address, walletClient, initializeSDK]);

  return {
    decryptBalance,
    isDecrypting: state.isDecrypting,
    error: state.error,
    isSDKInitialized,
    initializeSDK,
  };
};