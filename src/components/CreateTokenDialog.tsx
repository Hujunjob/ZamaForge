import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Coins } from "lucide-react";

interface CreateTokenDialogProps {
  onCreateToken: (tokenData: {
    name: string;
    symbol: string;
    totalSupply: number;
  }) => void;
}

export const CreateTokenDialog = ({ onCreateToken }: CreateTokenDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    totalSupply: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.symbol || !formData.totalSupply) {
      toast({
        title: "错误",
        description: "请填写所有字段",
        variant: "destructive"
      });
      return;
    }

    onCreateToken({
      name: formData.name,
      symbol: formData.symbol.toUpperCase(),
      totalSupply: parseInt(formData.totalSupply)
    });

    toast({
      title: "成功",
      description: `ERC20代币 ${formData.name} 已创建`,
    });

    setFormData({ name: "", symbol: "", totalSupply: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="lg" className="text-lg font-bold px-8 py-4 h-14">
          <Coins className="mr-3 h-6 w-6 animate-spin" />
          创建代币
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新的ERC20代币</DialogTitle>
          <DialogDescription>
            填写代币信息以创建新的ERC20代币
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">代币名称</Label>
            <Input
              id="name"
              placeholder="例如: My Token"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">代币符号</Label>
            <Input
              id="symbol"
              placeholder="例如: MTK"
              value={formData.symbol}
              onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalSupply">总供应量</Label>
            <Input
              id="totalSupply"
              type="number"
              placeholder="例如: 1000000"
              value={formData.totalSupply}
              onChange={(e) => setFormData(prev => ({ ...prev, totalSupply: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              取消
            </Button>
            <Button type="submit" variant="glow" className="flex-1">
              创建代币
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};