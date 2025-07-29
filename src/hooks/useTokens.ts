import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useZamaForge } from './useZamaForge';

export interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  type: 'erc20' | 'encrypted';
  contractAddress?: string;
  isBalanceEncrypted?: boolean;
}

const STORAGE_KEY = 'zamaforge_tokens';

export const useTokens = () => {
  const { address } = useAccount();
  const { zamaForgeInfo, isLoading: zamaForgeLoading } = useZamaForge();
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
    }

    setTokens(loadedTokens);
  }, [address, zamaForgeInfo?.contractAddress, zamaForgeInfo?.name, zamaForgeInfo?.symbol, zamaForgeInfo?.balance, zamaForgeLoading]);

  // Save tokens to localStorage whenever tokens change (exclude ZamaForge token)
  useEffect(() => {
    if (address && tokens.length > 0) {
      const storageKey = `${STORAGE_KEY}_${address}`;
      // Filter out ZamaForge token before saving to cache
      const tokensToCache = tokens.filter(
        token => !token.id.startsWith('zamaforge_')
      );
      if (tokensToCache.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(tokensToCache));
      }
    }
  }, [tokens, address]);

  const addToken = (token: Omit<Token, 'id'>) => {
    // Prevent adding duplicate ZamaForge tokens
    const ZAMAFORGE_CONTRACT_ADDRESS = '0xdc5A3601541518A3B52879ef5F231f6A624C93EB';
    if (token.contractAddress === ZAMAFORGE_CONTRACT_ADDRESS) {
      return; // ZamaForge token is automatically added
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