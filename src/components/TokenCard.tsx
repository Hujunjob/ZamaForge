import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Coins, Shield } from "lucide-react";

interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  type: 'erc20' | 'encrypted';
  contractAddress?: string;
}

interface TokenCardProps {
  token: Token;
  onConvert: (token: Token) => void;
}

export const TokenCard = ({ token, onConvert }: TokenCardProps) => {
  return (
    <Card className="group hover:shadow-neon hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-2 border-primary/20 bg-gradient-card backdrop-blur-sm overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
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
              <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary-glow transition-colors duration-300">
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
          <span className="text-2xl font-black text-foreground bg-gradient-primary bg-clip-text text-transparent">
            {token.balance.toLocaleString()} {token.symbol}
          </span>
        </div>
        
        {token.contractAddress && (
          <div className="space-y-2">
            <span className="text-sm text-foreground/70 font-medium">合约地址</span>
            <p className="text-xs text-foreground/60 font-mono bg-muted/50 px-3 py-2 rounded-lg border border-primary/10">
              {token.contractAddress}
            </p>
          </div>
        )}
        
        <Button 
          onClick={() => onConvert(token)} 
          variant="glow" 
          size="default" 
          className="w-full mt-6 h-12 text-base font-bold"
        >
          <ArrowLeftRight className="h-5 w-5 mr-2" />
          转换代币
        </Button>
      </CardContent>
    </Card>
  );
};