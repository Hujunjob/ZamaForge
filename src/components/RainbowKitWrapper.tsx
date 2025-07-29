import { ReactNode, useMemo } from 'react';
import { RainbowKitProvider, Locale } from '@rainbow-me/rainbowkit';
import { useTranslation } from 'react-i18next';

interface RainbowKitWrapperProps {
  children: ReactNode;
}

export const RainbowKitWrapper = ({ children }: RainbowKitWrapperProps) => {
  const { i18n } = useTranslation();
  
  const locale = useMemo((): Locale => {
    switch (i18n.language) {
      case 'zh':
        return 'zh-CN';
      case 'fr':
        return 'fr';
      case 'en':
      default:
        return 'en-US';
    }
  }, [i18n.language]);

  return (
    <RainbowKitProvider locale={locale}>
      {children}
    </RainbowKitProvider>
  );
};