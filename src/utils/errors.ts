import i18n from '@/i18n/config';

export const getWalletNotConnectedError = () => {
  return i18n.t('wallet.notConnected');
};

export const getWalletConnectionError = () => {
  return i18n.t('wallet.connectionError');
};

export const getAirdropError = () => {
  return i18n.t('wallet.airdropError');
};