import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useZamaForge } from './useZamaForge';
import { useConfidentialTokenFactory } from './useConfidentialTokenFactory';

export interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  type: 'erc20' | 'encrypted';
  contractAddress?: string;
  isBalanceEncrypted?: boolean;
  decimals?: number; // 代币小数位数，默认18
}

const STORAGE_KEY = 'zamaforge_tokens';

export const useTokens = () => {
  const { address } = useAccount();
  const { zamaForgeInfo, isLoading: zamaForgeLoading } = useZamaForge();
  const { confidentialTokenAddress } = useConfidentialTokenFactory();
  const [tokens, setTokens] = useState<Token[]>([]);

  // Load tokens from localStorage on component mount and include ZamaForge token
  useEffect(() => {
    if (!address) {
      setTokens([]);
      return;
    }

    const storageKey = `${STORAGE_KEY}_${address}`;
    const cachedTokens = localStorage.getItem(storageKey);
    let loadedTokens: Token[] = [];
    
    if (cachedTokens) {
      try {
        loadedTokens = JSON.parse(cachedTokens);
      } catch (error) {
        console.error('Failed to parse cached tokens:', error);
        loadedTokens = [];
      }
    }

    // Always include ZamaForge token if available
    if (zamaForgeInfo && !zamaForgeLoading) {
      const zamaForgeToken: Token = {
        id: `zamaforge_${zamaForgeInfo.contractAddress}`,
        name: zamaForgeInfo.name,
        symbol: zamaForgeInfo.symbol,
        balance: zamaForgeInfo.balance,
        type: 'erc20',
        contractAddress: zamaForgeInfo.contractAddress,
      };

      // Check if ZamaForge token already exists in loaded tokens
      const existingZamaForgeIndex = loadedTokens.findIndex(
        token => token.contractAddress === zamaForgeInfo.contractAddress
      );

      if (existingZamaForgeIndex >= 0) {
        // Update existing ZamaForge token with latest balance
        loadedTokens[existingZamaForgeIndex] = zamaForgeToken;
      } else {
        // Add ZamaForge token at the beginning
        loadedTokens.unshift(zamaForgeToken);
      }

      // Also include the corresponding confidential token if available
      if (confidentialTokenAddress && confidentialTokenAddress !== '0x0000000000000000000000000000000000000000') {
        const confidentialZamaForgeToken: Token = {
          id: `confidential_zamaforge_${confidentialTokenAddress}`,
          name: `${zamaForgeInfo.name} (加密)`,
          symbol: `c${zamaForgeInfo.symbol}`,
          balance: 0, // We don't have the balance yet, would need to decrypt
          type: 'encrypted',
          contractAddress: confidentialTokenAddress as string,
          isBalanceEncrypted: true,
          decimals: 6, // 加密代币使用6位小数
        };

        // Check if confidential ZamaForge token already exists
        const existingConfidentialIndex = loadedTokens.findIndex(
          token => token.contractAddress === confidentialTokenAddress
        );

        if (existingConfidentialIndex >= 0) {
          // Update existing confidential token
          loadedTokens[existingConfidentialIndex] = confidentialZamaForgeToken;
        } else {
          // Add confidential token after the ERC20 token
          const zamaForgeIndex = loadedTokens.findIndex(token => token.id.startsWith('zamaforge_'));
          if (zamaForgeIndex >= 0) {
            loadedTokens.splice(zamaForgeIndex + 1, 0, confidentialZamaForgeToken);
          } else {
            loadedTokens.unshift(confidentialZamaForgeToken);
          }
        }
      }
    }

    setTokens(loadedTokens);
  }, [address, zamaForgeInfo?.contractAddress, zamaForgeInfo?.name, zamaForgeInfo?.symbol, zamaForgeInfo?.balance, zamaForgeLoading, confidentialTokenAddress]);

  // Save tokens to localStorage whenever tokens change (exclude ZamaForge token)
  useEffect(() => {
    if (address && tokens.length > 0) {
      const storageKey = `${STORAGE_KEY}_${address}`;
      // Filter out ZamaForge tokens (both ERC20 and confidential) before saving to cache
      const tokensToCache = tokens.filter(
        token => !token.id.startsWith('zamaforge_') && !token.id.startsWith('confidential_zamaforge_')
      );
      if (tokensToCache.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(tokensToCache));
      }
    }
  }, [tokens, address]);

  const addToken = (token: Omit<Token, 'id'>) => {
    // Prevent adding duplicate ZamaForge tokens
    const ZAMAFORGE_CONTRACT_ADDRESS = '0xdc5A3601541518A3B52879ef5F231f6A624C93EB';
    if (token.contractAddress === ZAMAFORGE_CONTRACT_ADDRESS || 
        (confidentialTokenAddress && token.contractAddress === confidentialTokenAddress)) {
      return; // ZamaForge tokens are automatically added
    }

    const newToken: Token = {
      ...token,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
    };
    setTokens(prev => [...prev, newToken]);
  };

  const updateToken = (tokenId: string, updates: Partial<Token>) => {
    setTokens(prev => prev.map(token => 
      token.id === tokenId ? { ...token, ...updates } : token
    ));
  };

  const removeToken = (tokenId: string) => {
    setTokens(prev => prev.filter(token => token.id !== tokenId));
  };

  const getTokensByType = (type: 'erc20' | 'encrypted') => {
    return tokens.filter(token => token.type === type);
  };

  const clearAllTokens = () => {
    if (address) {
      const storageKey = `${STORAGE_KEY}_${address}`;
      localStorage.removeItem(storageKey);
      setTokens([]);
    }
  };

  return {
    tokens,
    addToken,
    updateToken,
    removeToken,
    getTokensByType,
    clearAllTokens,
    erc20Tokens: getTokensByType('erc20'),
    encryptedTokens: getTokensByType('encrypted'),
  };
};