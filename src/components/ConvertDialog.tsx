import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpDown, Shield, Coins } from "lucide-react";
import { Token } from "@/hooks/useTokens";

interface ConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: Token | null;
  onConvert: (tokenId: string, amount: number, toType: 'erc20' | 'encrypted') => Promise<void>;
  isLoading?: boolean;
}

export const ConvertDialog = ({ open, onOpenChange, token, onConvert, isLoading = false }: ConvertDialogProps) => {
  const [amount, setAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  if (!token) return null;

  const targetType = token.type === 'erc20' ? 'encrypted' : 'erc20';

  const handleConvert = async () => {
    const convertAmount = parseFloat(amount);
    
    if (!convertAmount || convertAmount <= 0) {
      toast({
        title: "错误",
        description: "请输入有效的转换数量",
        variant: "destructive"
      });
      return;
    }

    if (convertAmount > token.balance) {
      toast({
        title: "错误", 
        description: "转换数量不能超过余额",
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
      // 错误处理已在父组件中完成
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
            代币转换
          </DialogTitle>
          <DialogDescription>
            将 {token.name} 从 {token.type === 'erc20' ? 'ERC20代币' : '加密代币'} 转换为 {targetType === 'erc20' ? 'ERC20代币' : '加密代币'}
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
                <p className="text-sm text-muted-foreground">当前余额: {token.balance.toLocaleString()} {token.symbol}</p>
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
                <p className="text-sm text-muted-foreground">{targetType === 'encrypted' ? '加密代币' : 'ERC20代币'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">转换数量</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`输入要转换的 ${token.symbol} 数量`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={token.balance}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={handleConvert} 
              variant="glow" 
              className="flex-1"
              disabled={isConverting || isLoading}
            >
              {isConverting || isLoading ? "转换中..." : "确认转换"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};