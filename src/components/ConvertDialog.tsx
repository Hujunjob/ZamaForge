import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpDown, Shield, Coins } from "lucide-react";
import { Token } from "@/hooks/useTokens";
import { useTranslation } from 'react-i18next';

// Format token balance display
const formatTokenBalance = (balance: string | number, decimals: number = 18, symbol: string, isRawValue: boolean = false) => {
  const balanceNum = typeof balance === 'string' ? Number(balance) : balance;
  
  let actualBalance = balanceNum;
  
  if (isRawValue) {
    const divisor = Math.pow(10, decimals);
    actualBalance = balanceNum / divisor;
  }
  
  const formattedBalance = actualBalance.toFixed(decimals <= 6 ? decimals : 6);
  const cleanedBalance = parseFloat(formattedBalance).toString();
  return `${parseFloat(cleanedBalance).toLocaleString()} ${symbol}`;
};

interface ConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: Token | null;
  onConvert: (tokenId: string, amount: number, toType: 'erc20' | 'encrypted') => Promise<void>;
  isLoading?: boolean;
}

export const ConvertDialog = ({ open, onOpenChange, token, onConvert, isLoading = false }: ConvertDialogProps) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  if (!token) return null;

  const targetType = token.type === 'erc20' ? 'encrypted' : 'erc20';
  
  // Get display balance: if encrypted token and decrypted, show decrypted balance
  const getDisplayBalance = () => {
    if (token.isBalanceEncrypted && token.decryptedBalance) {
      return formatTokenBalance(token.decryptedBalance, token.decimals || 18, token.symbol, true);
    }
    return formatTokenBalance(token.balance, token.decimals || 18, token.symbol, false);
  };
  
  // Get actual available balance value
  const getActualBalance = () => {
    if (token.isBalanceEncrypted && token.decryptedBalance) {
      const divisor = Math.pow(10, token.decimals || 18);
      return Number(token.decryptedBalance) / divisor;
    }
    return token.balance;
  };

  const handleConvert = async () => {
    const convertAmount = parseFloat(amount);
    
    if (!convertAmount || convertAmount <= 0) {
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: "destructive"
      });
      return;
    }

    if (convertAmount > getActualBalance()) {
      toast({
        title: t('common.error'), 
        description: t('convert.messages.insufficientBalance'),
        variant: "destructive"
      });
      return;
    }

    setIsConverting(true);
    
    try {
      await onConvert(token.id, convertAmount, targetType);
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            {t('convert.title')}
          </DialogTitle>
          <DialogDescription>
            {t('convert.from')} {token.name} {token.type === 'erc20' ? t('tokens.erc20') : t('tokens.encrypted')} {t('convert.to')} {targetType === 'erc20' ? t('tokens.erc20') : t('tokens.encrypted')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              {token.type === 'encrypted' ? 
                <Shield className="h-5 w-5 text-primary" /> : 
                <Coins className="h-5 w-5 text-accent-foreground" />
              }
              <div>
                <p className="font-medium">{token.name}</p>
                <p className="text-sm text-muted-foreground">{t('convert.balance')}: {getDisplayBalance()}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowUpDown className="h-8 w-8 text-primary animate-pulse" />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10 border border-primary/20">
            <div className="flex items-center gap-3">
              {targetType === 'encrypted' ? 
                <Shield className="h-5 w-5 text-primary" /> : 
                <Coins className="h-5 w-5 text-accent-foreground" />
              }
              <div>
                <p className="font-medium">{token.name}</p>
                <p className="text-sm text-muted-foreground">{targetType === 'encrypted' ? t('tokens.encrypted') : t('tokens.erc20')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('convert.amount')}</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`${t('convert.amount')} ${token.symbol}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={getActualBalance()}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleConvert} 
              variant="glow" 
              className="flex-1"
              disabled={isConverting || isLoading}
            >
              {isConverting || isLoading ? t('common.loading') + '...' : t('convert.convert')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};