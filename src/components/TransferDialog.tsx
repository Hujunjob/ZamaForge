import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Send, Shield, Coins } from "lucide-react";
import { Token } from "@/hooks/useTokens";
import { useTranslation } from 'react-i18next';

// 格式化代币余额显示
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

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: Token | null;
  onTransfer: (tokenId: string, toAddress: string, amount: number) => Promise<void>;
  isTransferring?: boolean;
  isEncrypting?: boolean;
}

export const TransferDialog = ({ open, onOpenChange, token, onTransfer, isTransferring = false, isEncrypting = false }: TransferDialogProps) => {
  const { t } = useTranslation();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [localProcessing, setLocalProcessing] = useState(false);
  const { toast } = useToast();

  // Debug logging for button states
  useEffect(() => {
    console.log('🔍 TransferDialog状态更新:', { isTransferring, isEncrypting, tokenType: token?.type });
  }, [isTransferring, isEncrypting, token?.type]);


  if (!token) return null;

  // 获取显示余额：如果是加密代币且已解密，显示解密后的余额
  const getDisplayBalance = () => {
    if (token.isBalanceEncrypted && token.decryptedBalance) {
      return formatTokenBalance(token.decryptedBalance, token.decimals || 18, token.symbol, true);
    }
    return formatTokenBalance(token.balance, token.decimals || 18, token.symbol, false);
  };
  
  // 获取实际可用余额数值
  const getActualBalance = () => {
    if (token.isBalanceEncrypted && token.decryptedBalance) {
      const divisor = Math.pow(10, token.decimals || 18);
      return Number(token.decryptedBalance) / divisor;
    }
    return token.balance;
  };

  const handleTransfer = async () => {
    console.log('🚀 TransferDialog handleTransfer 被调用');
    console.log('📝 当前表单数据:', { toAddress, amount, tokenId: token.id });
    
    const transferAmount = parseFloat(amount);
    
    if (!toAddress || !toAddress.startsWith('0x') || toAddress.length !== 42) {
      console.log('❌ 地址验证失败:', toAddress);
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: "destructive"
      });
      return;
    }
    
    if (!transferAmount || transferAmount <= 0) {
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: "destructive"
      });
      return;
    }

    if (transferAmount > getActualBalance()) {
      toast({
        title: t('common.error'), 
        description: t('transfer.messages.insufficientBalance'),
        variant: "destructive"
      });
      return;
    }

    // Set local processing state immediately for instant feedback
    setLocalProcessing(true);
    console.log('🔄 设置本地处理状态为true');

    try {
      // Start the transfer process - this will trigger the button state change immediately
      await onTransfer(token.id, toAddress, transferAmount);
      
      // Only close dialog and clear fields on successful transfer
      setToAddress("");
      setAmount("");
      setLocalProcessing(false);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
      setLocalProcessing(false);
      console.error('Transfer dialog error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t('transfer.title')}
          </DialogTitle>
          <DialogDescription>
            {t('transfer.to')} {token.name} ({token.symbol})
            {token.type === 'encrypted' && (
              <div className="mt-2 text-sm text-primary bg-primary/5 border border-primary/20 rounded p-2">
                <Shield className="h-3 w-3 inline mr-1" />
                {t('tokenCard.encrypted')}
              </div>
            )}
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
                <p className="text-sm text-muted-foreground">
                  {t('transfer.balance')}: {getDisplayBalance()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAddress">{t('transfer.to')}</Label>
            <Input
              id="toAddress"
              placeholder="0x..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('transfer.amount')}</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`${t('transfer.amount')} ${token.symbol}`}
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
              onClick={handleTransfer} 
              variant="glow" 
              className="flex-1"
              disabled={isTransferring || isEncrypting || localProcessing}
            >
              <Send className="h-4 w-4 mr-2" />
              {localProcessing ? (token.type === 'encrypted' ? t('common.loading') + '...' : t('transfer.messages.transferring') + '...') : 
               isEncrypting ? t('common.loading') + '...' : 
               isTransferring ? t('transfer.messages.transferring') + '...' : 
               t('transfer.transfer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};