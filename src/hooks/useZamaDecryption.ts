import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useZamaSDK } from '@/contexts/ZamaSDKContext';
import { getWalletNotConnectedError } from '@/utils/errors';

interface DecryptionState {
  isDecrypting: boolean;
  error: string | null;
}

export const useZamaDecryption = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { initializeSDK, instance, isInitialized } = useZamaSDK();
  const [state, setState] = useState<DecryptionState>({
    isDecrypting: false,
    error: null,
  });

  // Decrypt encrypted balance
  const decryptBalance = useCallback(async (
    ciphertextHandle: string,
    contractAddress: string
  ): Promise<string> => {
    if (!address || !walletClient) {
      throw new Error(getWalletNotConnectedError());
    }

    // Check if handle is zero (0x0000000000000000000000000000000000000000000000000000000000000000)
    const zeroHandle = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (ciphertextHandle === zeroHandle || ciphertextHandle === '0x0' || !ciphertextHandle) {
      setState(prev => ({ ...prev, isDecrypting: false, error: null }));
      return '0';
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
      
      // Handle case where decryption returns undefined/null or zero value
      if (decryptedValue === undefined || decryptedValue === null) {
        return '0';
      }
      
      return decryptedValue.toString();
    } catch (error) {
      console.error('解密失败:', error);
      setState(prev => ({ 
        ...prev, 
        isDecrypting: false, 
        error: '解密失败，请重试' 
      }));
      
      // If decryption fails, return '0' instead of throwing error
      console.warn('解密失败，返回默认值 0');
      return '0';
    }
  }, [address, walletClient, initializeSDK]);

  return {
    decryptBalance,
    isDecrypting: state.isDecrypting,
    error: state.error,
    isSDKInitialized: isInitialized,
    initializeSDK,
  };
};