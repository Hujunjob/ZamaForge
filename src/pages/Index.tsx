import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenCard } from "@/components/TokenCard";
import { CreateTokenDialog } from "@/components/CreateTokenDialog";
import { ConvertDialog } from "@/components/ConvertDialog";
import { TransferDialog } from "@/components/TransferDialog";
import { Header } from "@/components/Header";
import { Shield, Coins, ArrowLeftRight, Sparkles, Zap, Lock, Trash2 } from "lucide-react";
import { useTokens, Token } from "@/hooks/useTokens";
import { useToast } from "@/hooks/use-toast";
import { useConfidentialTokenFactory } from "@/hooks/useConfidentialTokenFactory";
import { useTokenTransfer } from "@/hooks/useTokenTransfer";
import { useUnwrapToken } from "@/hooks/useUnwrapToken";
import { readContract } from '@wagmi/core';
import { useConfig, useAccount } from 'wagmi';
import ConfidentialTokenFactoryABI from '../../abis/ConfidentialTokenFactory.json';
import heroImage from "@/assets/hero-blockchain.jpg";

const Index = () => {
  const { t } = useTranslation();
  const { tokens, addToken, updateToken, clearAllTokens, erc20Tokens, encryptedTokens } = useTokens();
  const { toast } = useToast();
  const { wrapERC20, isPending: isWrapping, isConfirmed, error: wrapError } = useConfidentialTokenFactory();
  const { transferERC20, transferConfidential, isTransferring, isEncrypting } = useTokenTransfer();
  const { unwrapConfidentialToken, isUnwrapping, isEncrypting: isUnwrapEncrypting } = useUnwrapToken();
  const config = useConfig();
  const { address } = useAccount();
  
  // ConfidentialTokenFactory合约地址
  const FACTORY_CONTRACT_ADDRESS = '0x8d3F4e8fe379dBEA133420Eb6Be79033A0e78593' as const;
  const factoryAbi = ConfidentialTokenFactoryABI as any;

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);


  const handleConvertToken = async (tokenId: string, amount: number, toType: 'erc20' | 'encrypted') => {    
    const sourceToken = tokens.find(t => t.id === tokenId);
    console.log("handleConvertToken:",amount,toType);
    console.log("sourceToken:",sourceToken);
    
    if (!sourceToken) {
      toast({
        title: t('common.error'),
        description: t('convert.messages.tokenNotFound'),
        variant: "destructive"
      });
      return;
    }

    // 获取实际余额：对于加密代币使用decryptedBalance，对于ERC20使用balance
    const actualBalance = sourceToken.isBalanceEncrypted && sourceToken.decryptedBalance
      ? Number(sourceToken.decryptedBalance) / Math.pow(10, sourceToken.decimals || 18)
      : sourceToken.balance;
    
    if (actualBalance < amount) {
      toast({
        title: t('common.error'),
        description: t('convert.messages.insufficientBalance'),
        variant: "destructive"
      });
      return;
    }

    try {
      if (sourceToken.type === 'erc20' && toType === 'encrypted') {
        // ERC20 转换为加密代币：调用 wrapERC20
        if (!sourceToken.contractAddress) {
          toast({
            title: "错误", 
            description: "缺少合约地址",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "正在转换",
          description: "正在将ERC20代币转换为加密代币，请确认交易..."
        });

        await wrapERC20(sourceToken.contractAddress as `0x${string}`, amount);
        
        // 获取真实的加密代币合约地址
        const confidentialTokenAddress = await readContract(config, {
          address: FACTORY_CONTRACT_ADDRESS,
          abi: factoryAbi,
          functionName: 'getConfidentialToken',
          args: [sourceToken.contractAddress],
        }) as `0x${string}`;
        
        toast({
          title: "转换成功",
          description: `已将 ${amount} ${sourceToken.symbol} 转换为加密代币`
        });

        // 更新本地状态
        updateToken(tokenId, { balance: sourceToken.balance - amount });

        // 查找是否已存在目标类型的同名代币
        const existingTargetToken = tokens.find(t => 
          t.name === sourceToken.name && 
          t.symbol === sourceToken.symbol && 
          t.type === toType
        );

        if (existingTargetToken) {
          updateToken(existingTargetToken.id, { 
            balance: existingTargetToken.balance + amount 
          });
        } else {
          // 创建新的加密代币，使用真实的合约地址
          addToken({
            name: sourceToken.name,
            symbol: sourceToken.symbol,
            balance: amount,
            type: toType,
            contractAddress: confidentialTokenAddress,
            isBalanceEncrypted: toType === 'encrypted'
          });
        }

      } else if (sourceToken.type === 'encrypted' && toType === 'erc20') {
        // 加密代币转换为ERC20：调用 unwrap
        if (!sourceToken.contractAddress) {
          toast({
            title: "错误", 
            description: "缺少加密代币合约地址",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "正在转换",
          description: "正在将加密代币转换为ERC20代币，请确认交易..."
        });

        // 获取对应的ERC20代币地址
        const erc20TokenAddress = await readContract(config, {
          address: FACTORY_CONTRACT_ADDRESS,
          abi: factoryAbi,
          functionName: 'getERC20',
          args: [sourceToken.contractAddress],
        }) as `0x${string}`;

        if (!erc20TokenAddress || erc20TokenAddress === '0x0000000000000000000000000000000000000000') {
          toast({
            title: "错误",
            description: "找不到对应的ERC20代币",
            variant: "destructive"
          });
          return;
        }

        await unwrapConfidentialToken(
          sourceToken.contractAddress as `0x${string}`,
          address as `0x${string}`,
          amount
        );
        
        toast({
          title: "转换成功",
          description: `已将 ${amount} ${sourceToken.symbol} 加密代币转换为ERC20代币`
        });

        // 更新本地状态 - 减少加密代币余额
        if (sourceToken.isBalanceEncrypted && sourceToken.decryptedBalance) {
          const newDecryptedBalance = Number(sourceToken.decryptedBalance) - (amount * Math.pow(10, sourceToken.decimals || 18));
          updateToken(tokenId, { decryptedBalance: newDecryptedBalance.toString() });
        } else {
          updateToken(tokenId, { balance: sourceToken.balance - amount });
        }

        // 查找是否已存在目标类型的同名代币
        const existingTargetToken = tokens.find(t => 
          t.name === sourceToken.name && 
          t.symbol === sourceToken.symbol && 
          t.type === toType
        );

        if (existingTargetToken) {
          updateToken(existingTargetToken.id, { 
            balance: existingTargetToken.balance + amount 
          });
        } else {
          // 创建新的ERC20代币记录
          addToken({
            name: sourceToken.name.replace(" (加密)", ""), // 移除加密标识
            symbol: sourceToken.symbol.replace("c", ""), // 移除加密前缀
            balance: amount,
            type: toType,
            contractAddress: erc20TokenAddress,
            isBalanceEncrypted: false
          });
        }
      }

    } catch (error) {
      console.error('转换失败:', error);
      toast({
        title: "转换失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  const handleTokenConvert = (token: Token) => {
    setSelectedToken(token);
    setConvertDialogOpen(true);
  };

  const handleTokenTransfer = (token: Token) => {
    setSelectedToken(token);
    setTransferDialogOpen(true);
  };

  const handleTransfer = async (tokenId: string, toAddress: string, amount: number) => {
    console.log('🎯 handleTransfer被调用:', { tokenId, toAddress, amount });
    
    const sourceToken = tokens.find(t => t.id === tokenId);
    console.log('🔍 查找到的代币:', sourceToken);
    
    if (!sourceToken) {
      console.error('❌ 找不到代币信息');
      toast({
        title: "错误",
        description: "找不到代币信息",
        variant: "destructive"
      });
      return;
    }

    if (!sourceToken.contractAddress) {
      console.error('❌ 缺少代币合约地址');
      toast({
        title: "错误",
        description: "缺少代币合约地址",
        variant: "destructive"
      });
      return;
    }

    try {
      if (sourceToken.type === 'encrypted') {
        // 加密代币转账 - 使用 confidentialTransfer
        console.log('🔐 开始加密代币转账流程');
        
        // Immediately show encrypting state
        toast({
          title: "正在转账",
          description: "正在加密转账金额，请稍候..."
        });

        console.log('📞 调用transferConfidential...');
        const result = await transferConfidential(
          sourceToken.contractAddress as `0x${string}`, 
          toAddress as `0x${string}`, 
          amount
        );
        console.log('✅ transferConfidential调用完成:', result);

        toast({
          title: "转账成功",
          description: `已向 ${toAddress.slice(0, 6)}...${toAddress.slice(-4)} 转账 ${amount} ${sourceToken.symbol}（加密）`
        });

        // 更新本地余额（减少发送方余额）
        const actualBalance = sourceToken.isBalanceEncrypted && sourceToken.decryptedBalance
          ? Number(sourceToken.decryptedBalance) / Math.pow(10, sourceToken.decimals || 18)
          : sourceToken.balance;
        
        if (actualBalance >= amount) {
          if (sourceToken.isBalanceEncrypted && sourceToken.decryptedBalance) {
            const newDecryptedBalance = Number(sourceToken.decryptedBalance) - (amount * Math.pow(10, sourceToken.decimals || 18));
            updateToken(tokenId, { decryptedBalance: newDecryptedBalance.toString() });
          } else {
            updateToken(tokenId, { balance: sourceToken.balance - amount });
          }
        }

      } else {
        // ERC20 代币转账 - 使用标准 transfer
        console.log('💰 开始ERC20代币转账流程');
        toast({
          title: "正在转账",
          description: "正在发起ERC20转账，请确认交易..."
        });

        console.log('📞 调用transferERC20...');
        const result = await transferERC20(
          sourceToken.contractAddress as `0x${string}`, 
          toAddress as `0x${string}`, 
          amount
        );
        console.log('✅ transferERC20调用完成:', result);

        toast({
          title: "转账成功", 
          description: `已向 ${toAddress.slice(0, 6)}...${toAddress.slice(-4)} 转账 ${amount} ${sourceToken.symbol}`
        });

        // 更新本地余额（减少发送方余额）
        if (sourceToken.balance >= amount) {
          updateToken(tokenId, { balance: sourceToken.balance - amount });
        }
      }
    } catch (error) {
      console.error('转账失败:', error);
      toast({
        title: "转账失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  const handleClearCache = () => {
    if (confirm(t('common.clearCacheConfirm'))) {
      clearAllTokens();
      toast({
        title: t('common.cacheCleared'),
        description: t('common.cacheDescription'),
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-background/50" />
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float opacity-60"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary-glow rounded-full animate-float delay-1000 opacity-40"></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-primary/50 rounded-full animate-float delay-2000 opacity-30"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-primary-glow rounded-full animate-float delay-500 opacity-50"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-32 text-center z-10">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-card border-2 border-primary/30 text-primary shadow-card backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-bold tracking-wide">{t('hero.badge')}</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-hero bg-clip-text text-transparent animate-gradient-shift bg-[length:300%_300%] tracking-tight">
              {t('hero.title')}
            </h1>
            
            <p className="text-2xl md:text-3xl text-foreground/90 max-w-4xl mx-auto leading-relaxed font-medium">
              {t('hero.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <CreateTokenDialog />
              <Button variant="outline" size="lg" className="group">
                <span>{t('hero.learnMore')}</span>
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-primary bg-clip-text text-transparent">
              {t('features.title')}
            </h2>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto font-medium">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="group hover:shadow-neon hover:-translate-y-4 hover:scale-105 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10"></div>
              <CardHeader className="text-center relative z-10 pt-8">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                  <Coins className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary-glow">
                  {t('features.erc20.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pb-8">
                <CardDescription className="text-center text-lg text-foreground/70 leading-relaxed">
                  {t('features.erc20.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-neon hover:-translate-y-4 hover:scale-105 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10"></div>
              <CardHeader className="text-center relative z-10 pt-8">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                  <ArrowLeftRight className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary-glow">
                  {t('features.conversion.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pb-8">
                <CardDescription className="text-center text-lg text-foreground/70 leading-relaxed">
                  {t('features.conversion.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-neon hover:-translate-y-4 hover:scale-105 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10"></div>
              <CardHeader className="text-center relative z-10 pt-8">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary-glow">
                  {t('features.encryption.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pb-8">
                <CardDescription className="text-center text-lg text-foreground/70 leading-relaxed">
                  {t('features.encryption.description')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tokens Management */}
      <section id="tokens" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-6">
              <h2 className="text-4xl md:text-6xl font-black bg-gradient-primary bg-clip-text text-transparent">
                {t('tokens.title')}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearCache}
                className="ml-4 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
                title={t('tokens.clearCache')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('tokens.clearCache')}
              </Button>
            </div>
            <p className="text-xl md:text-2xl text-foreground/80 font-medium">
              {t('tokens.subtitle')}
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-12 h-16 bg-gradient-card border-2 border-primary/20 shadow-card backdrop-blur-sm">
              <TabsTrigger value="all" className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow">
                <Zap className="h-5 w-5" />
                {t('tokens.all')}
              </TabsTrigger>
              <TabsTrigger value="erc20" className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow">
                <Coins className="h-5 w-5" />
                {t('tokens.erc20')}
              </TabsTrigger>
              <TabsTrigger value="encrypted" className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow">
                <Lock className="h-5 w-5" />
                {t('tokens.encrypted')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tokens.map(token => (
                  <TokenCard 
                    key={token.id} 
                    token={token} 
                    onConvert={handleTokenConvert}
                    onTransfer={handleTokenTransfer}
                    onUpdateToken={updateToken}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="erc20" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {erc20Tokens.map(token => (
                  <TokenCard 
                    key={token.id} 
                    token={token} 
                    onConvert={handleTokenConvert}
                    onTransfer={handleTokenTransfer}
                    onUpdateToken={updateToken}
                  />
                ))}
              </div>
              {erc20Tokens.length === 0 && (
                <div className="text-center py-12">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('tokens.noErc20')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="encrypted" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {encryptedTokens.map(token => (
                  <TokenCard 
                    key={token.id} 
                    token={token} 
                    onConvert={handleTokenConvert}
                    onTransfer={handleTokenTransfer}
                    onUpdateToken={updateToken}
                  />
                ))}
              </div>
              {encryptedTokens.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('tokens.noEncrypted')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <ConvertDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        token={selectedToken}
        onConvert={handleConvertToken}
        isLoading={isWrapping || isUnwrapping || isUnwrapEncrypting}
      />
      
      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        token={selectedToken}
        onTransfer={handleTransfer}
        isTransferring={isTransferring}
        isEncrypting={isEncrypting}
      />
    </div>
  );
};

export default Index;