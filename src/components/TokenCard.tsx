import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Coins, Shield, Eye, EyeOff, Copy, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Token } from "@/hooks/useTokens";
import { useZamaDecryption } from "@/hooks/useZamaDecryption";
import { useConfidentialTokenWrapper } from "@/hooks/useConfidentialTokenFactory";

// 格式化代币余额，处理小数位
const formatTokenBalance = (balance: string | number, decimals: number = 18, symbol: string, isRawValue: boolean = false) => {
  const balanceNum = typeof balance === 'string' ? Number(balance) : balance;
  
  let actualBalance = balanceNum;
  
  // 只有当是原始值时才需要除以divisor进行转换
  if (isRawValue) {
    const divisor = Math.pow(10, decimals);
    actualBalance = balanceNum / divisor;
  }
  
  // 格式化显示，最多显示6位小数
  const formattedBalance = actualBalance.toFixed(decimals <= 6 ? decimals : 6);
  
  // 移除末尾的0
  const cleanedBalance = parseFloat(formattedBalance).toString();
  return `${parseFloat(cleanedBalance).toLocaleString()} ${symbol}`;
};

interface TokenCardProps {
  token: Token;
  onConvert: (token: Token) => void;
  onTransfer?: (token: Token) => void;
  onUpdateToken?: (tokenId: string, updates: Partial<Token>) => void;
}

export const TokenCard = ({ token, onConvert, onTransfer, onUpdateToken }: TokenCardProps) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(
    !token.isBalanceEncrypted || !!token.decryptedBalance
  );
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(
    token.decryptedBalance || null
  );
  const { toast } = useToast();
  const { decryptBalance, isDecrypting, error: decryptError } = useZamaDecryption();
  
  // Get confidential balance handle for encrypted tokens
  const { confidentialBalance } = useConfidentialTokenWrapper(
    token.contractAddress as `0x${string}` || '0x0000000000000000000000000000000000000000'
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "已复制",
        description: "合约地址已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  const toggleBalanceVisibility = async () => {
    if (token.isBalanceEncrypted) {
      if (!decryptedBalance) {
        // 需要先解密余额
        if (!confidentialBalance || !token.contractAddress) {
          toast({
            title: "解密失败",
            description: "无法获取加密余额数据",
            variant: "destructive",
          });
          return;
        }

        // 显示解密中提示
        toast({
          title: "解密中...",
          description: "正在解密代币余额，请稍候",
        });

        try {
          const decrypted = await decryptBalance(
            confidentialBalance as string,
            token.contractAddress
          );
          setDecryptedBalance(decrypted);
          setIsBalanceVisible(true);
          
          // 更新token状态，保存解密后的余额
          if (onUpdateToken) {
            onUpdateToken(token.id, { decryptedBalance: decrypted });
          }
          
          toast({
            title: "解密成功",
            description: "余额已解密显示",
          });
        } catch (error) {
          toast({
            title: "解密失败",
            description: decryptError || "解密过程中出现错误",
            variant: "destructive",
          });
        }
      } else {
        // 已解密，切换显示/隐藏
        setIsBalanceVisible(!isBalanceVisible);
      }
    } else {
      // 普通ERC20代币，直接切换显示/隐藏
      setIsBalanceVisible(!isBalanceVisible);
    }
  };

  return (
    <Card className="group hover:shadow-neon hover:-translate-y-2 hover:scale-105 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-neon"></div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-glow ${
              token.type === 'erc20' 
                ? 'bg-gradient-primary' 
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500'
            }`}>
              {token.type === 'erc20' ? (
                <Coins className="h-7 w-7 text-primary-foreground" />
              ) : (
                <Shield className="h-7 w-7 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary-glow">
                {token.name}
              </CardTitle>
              <p className="text-base text-foreground/60 font-medium">{token.symbol}</p>
            </div>
          </div>
          <Badge 
            variant={token.type === 'erc20' ? 'default' : 'secondary'} 
            className={`font-bold text-sm px-3 py-1 ${
              token.type === 'erc20' 
                ? 'bg-gradient-primary text-primary-foreground shadow-glow' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow'
            }`}
          >
            {token.type === 'erc20' ? 'ERC20' : '加密'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/10">
          <span className="text-base text-foreground/70 font-medium">余额</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-foreground bg-gradient-primary bg-clip-text text-transparent">
              {token.isBalanceEncrypted ? (
                // 加密代币逻辑
                decryptedBalance ? (
                  // 已解密，显示解密后的余额
                  formatTokenBalance(decryptedBalance, token.decimals || 18, token.symbol, true)
                ) : isBalanceVisible ? (
                  // 正在解密中，显示loading或隐藏状态
                  isDecrypting ? '解密中...' : '••••••••'
                ) : (
                  // 未解密，显示隐藏状态
                  '••••••••'
                )
              ) : (
                // 普通ERC20代币逻辑
                isBalanceVisible 
                  ? formatTokenBalance(token.balance, token.decimals || 18, token.symbol, false)
                  : '••••••••'
              )}
            </span>
            {token.isBalanceEncrypted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBalanceVisibility}
                disabled={isDecrypting}
                className="h-8 w-8 p-0 hover:bg-primary/10"
              >
                {isDecrypting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : decryptedBalance ? (
                  // 已解密，显示隐藏图标（因为余额已显示）
                  <EyeOff className="h-4 w-4" />
                ) : (
                  // 未解密，显示显示图标
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {token.isBalanceEncrypted && (
          <div className="text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-3">
            <Shield className="h-4 w-4 inline mr-2" />
            代币数量加密，其他任何人无法追踪数量
          </div>
        )}
        
        {token.contractAddress && (
          <div className="space-y-2">
            <span className="text-sm text-foreground/70 font-medium">合约地址</span>
            <div className="flex items-center gap-2 text-xs text-foreground/60 font-mono bg-muted/50 px-3 py-2 rounded-lg border border-primary/10">
              <span className="flex-1">{token.contractAddress}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(token.contractAddress!)}
                className="h-6 w-6 p-0 hover:bg-primary/10"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 mt-6">
          <Button 
            onClick={() => onConvert(token)} 
            variant="glow" 
            size="default" 
            className="flex-1 h-12 text-base font-bold"
          >
            <ArrowLeftRight className="h-5 w-5 mr-2" />
            转换
          </Button>
          {onTransfer && (
            <Button 
              onClick={() => onTransfer(token)} 
              variant="outline" 
              size="default" 
              className="flex-1 h-12 text-base font-bold border-primary/30 hover:bg-primary/10"
            >
              <Send className="h-5 w-5 mr-2" />
              转账
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};