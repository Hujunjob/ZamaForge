import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenCard } from "@/components/TokenCard";
import { CreateTokenDialog } from "@/components/CreateTokenDialog";
import { ConvertDialog } from "@/components/ConvertDialog";
import { Header } from "@/components/Header";
import { Shield, Coins, ArrowLeftRight, Sparkles, Zap, Lock } from "lucide-react";
import heroImage from "@/assets/hero-blockchain.jpg";

interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  type: 'erc20' | 'encrypted';
  contractAddress?: string;
}

const Index = () => {
  const [tokens, setTokens] = useState<Token[]>([
    {
      id: '1',
      name: 'Zama Token',
      symbol: 'ZAMA',
      balance: 10000,
      type: 'erc20',
      contractAddress: '0x742d35cc...'
    },
    {
      id: '2',
      name: 'Private Coin',
      symbol: 'PRIV',
      balance: 5000,
      type: 'encrypted'
    },
    {
      id: '3',
      name: 'Demo Token',
      symbol: 'DEMO',
      balance: 25000,
      type: 'erc20',
      contractAddress: '0x123abc45...'
    }
  ]);

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const handleCreateToken = (tokenData: { name: string; symbol: string; totalSupply: number }) => {
    const newToken: Token = {
      id: Date.now().toString(),
      name: tokenData.name,
      symbol: tokenData.symbol,
      balance: tokenData.totalSupply,
      type: 'erc20',
      contractAddress: `0x${Math.random().toString(16).slice(2, 10)}...`
    };
    setTokens(prev => [...prev, newToken]);
  };

  const handleConvertToken = (tokenId: string, amount: number, toType: 'erc20' | 'encrypted') => {
    setTokens(prev => prev.map(token => {
      if (token.id === tokenId) {
        // 减少原代币余额
        const updatedToken = { ...token, balance: token.balance - amount };
        
        // 查找目标类型的同名代币或创建新的
        const targetTokenExists = prev.find(t => 
          t.name === token.name && 
          t.symbol === token.symbol && 
          t.type === toType
        );
        
        if (!targetTokenExists) {
          // 创建新的目标类型代币
          const newTargetToken: Token = {
            id: Date.now().toString() + '_converted',
            name: token.name,
            symbol: token.symbol,
            balance: amount,
            type: toType,
            contractAddress: toType === 'erc20' ? `0x${Math.random().toString(16).slice(2, 10)}...` : undefined
          };
          setTimeout(() => {
            setTokens(current => [...current, newTargetToken]);
          }, 0);
        }
        
        return updatedToken;
      }
      
      // 增加目标类型代币余额
      if (token.name === selectedToken?.name && 
          token.symbol === selectedToken?.symbol && 
          token.type === toType) {
        return { ...token, balance: token.balance + amount };
      }
      
      return token;
    }));
  };

  const handleTokenConvert = (token: Token) => {
    setSelectedToken(token);
    setConvertDialogOpen(true);
  };

  const erc20Tokens = tokens.filter(token => token.type === 'erc20');
  const encryptedTokens = tokens.filter(token => token.type === 'encrypted');

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
              <span className="text-sm font-bold tracking-wide">全同态加密区块链革命</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-hero bg-clip-text text-transparent animate-gradient-shift bg-[length:300%_300%] tracking-tight">
              Zama Forge
            </h1>
            
            <p className="text-2xl md:text-3xl text-foreground/90 max-w-4xl mx-auto leading-relaxed font-medium">
              <span className="bg-gradient-primary bg-clip-text text-transparent">革命性</span>的全同态加密技术，实现
              <span className="text-primary-glow font-bold">ERC20代币</span>与
              <span className="text-primary-glow font-bold">加密代币</span>的无缝转换
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <CreateTokenDialog onCreateToken={handleCreateToken} />
              <Button variant="outline" size="lg" className="group">
                <span>了解更多</span>
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
              Zama 核心功能
            </h2>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto font-medium">
              体验前所未有的区块链隐私保护和代币管理功能
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="group hover:shadow-neon hover:-translate-y-4 hover:scale-105 transition-all duration-500 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <CardHeader className="text-center relative z-10 pt-8">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                  <Coins className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary-glow transition-colors duration-300">
                  ERC20代币生成
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pb-8">
                <CardDescription className="text-center text-lg text-foreground/70 leading-relaxed">
                  快速创建和部署自定义ERC20代币，支持完整的代币经济模型，一键启动您的区块链项目
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-neon hover:-translate-y-4 hover:scale-105 transition-all duration-500 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <CardHeader className="text-center relative z-10 pt-8">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                  <ArrowLeftRight className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary-glow transition-colors duration-300">
                  无缝代币转换
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pb-8">
                <CardDescription className="text-center text-lg text-foreground/70 leading-relaxed">
                  在ERC20代币和加密代币之间进行即时转换，保持完全的互操作性和流动性
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-neon hover:-translate-y-4 hover:scale-105 transition-all duration-500 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <CardHeader className="text-center relative z-10 pt-8">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary-glow transition-colors duration-300">
                  全同态加密
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pb-8">
                <CardDescription className="text-center text-lg text-foreground/70 leading-relaxed">
                  采用先进的全同态加密技术，在计算过程中保护数据隐私，确保绝对安全
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
            <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-primary bg-clip-text text-transparent">
              代币管理中心
            </h2>
            <p className="text-xl md:text-2xl text-foreground/80 font-medium">
              管理您的数字资产王国
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-12 h-16 bg-gradient-card border-2 border-primary/20 shadow-card backdrop-blur-sm">
              <TabsTrigger value="all" className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
                <Zap className="h-5 w-5" />
                全部代币
              </TabsTrigger>
              <TabsTrigger value="erc20" className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
                <Coins className="h-5 w-5" />
                ERC20代币
              </TabsTrigger>
              <TabsTrigger value="encrypted" className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
                <Lock className="h-5 w-5" />
                加密代币
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tokens.map(token => (
                  <TokenCard 
                    key={token.id} 
                    token={token} 
                    onConvert={handleTokenConvert}
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
                  />
                ))}
              </div>
              {erc20Tokens.length === 0 && (
                <div className="text-center py-12">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无ERC20代币</p>
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
                  />
                ))}
              </div>
              {encryptedTokens.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无加密代币</p>
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
      />
    </div>
  );
};

export default Index;