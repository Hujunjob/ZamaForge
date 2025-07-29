import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Loader2 } from "lucide-react";
import { useAirdrop } from "@/hooks/useAirdrop";

export const CreateTokenDialog = () => {
  const { toast } = useToast();
  const { claimTokens, isPending, error } = useAirdrop();

  const handleClaimForge = async () => {
    try {
      await claimTokens();
      
      toast({
        title: "领取成功",
        description: `成功领取 $FORGE 测试代币`,
      });
    } catch (err) {
      toast({
        title: "领取失败",
        description: error?.message || "领取过程中发生错误，请稍后重试",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button 
        variant="hero" 
        size="lg" 
        className="text-lg font-bold px-8 py-4 h-14"
        onClick={handleClaimForge}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            领取中...
          </>
        ) : (
          <>
            <Gift className="mr-3 h-6 w-6" />
            Claim $Z
          </>
        )}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        领取官方测试代币
      </p>
    </div>
  );
};