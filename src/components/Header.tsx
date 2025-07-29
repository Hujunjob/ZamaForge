import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Menu, Github, Twitter } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export const Header = () => {
  const { t } = useTranslation();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 header-blur">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black bg-gradient-hero bg-clip-text text-transparent">
                Zama Forge
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">{t('hero.badge')}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/80 hover:text-primary">
              {t('nav.features')}
            </a>
            <a href="#tokens" className="text-foreground/80 hover:text-primary">
              {t('nav.tokens')}
            </a>
            <a href="#docs" className="text-foreground/80 hover:text-primary">
              {t('nav.docs')}
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:flex items-center gap-2 bg-primary/10 border-primary/30 text-primary">
              <Zap className="h-3 w-3" />
              {t('nav.beta')}
            </Badge>
            
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>

            <LanguageSwitcher />

            <div className="hidden sm:flex">
              <ConnectButton />
            </div>
            
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};