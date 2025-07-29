import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Loader2 } from "lucide-react";
import { useAirdrop } from "@/hooks/useAirdrop";
import { useTranslation } from 'react-i18next';

export const CreateTokenDialog = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { claimTokens, isPending, error } = useAirdrop();

  const handleClaimForge = async () => {
    try {
      await claimTokens();
      
      toast({
        title: t('createToken.messages.success'),
        description: t('createToken.messages.success'),
      });
    } catch (err) {
      toast({
        title: t('createToken.messages.error'),
        description: error?.message || t('common.unknownError'),
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
            {t('common.loading')}...
          </>
        ) : (
          <>
            <Gift className="mr-3 h-6 w-6" />
            {t('createToken.button')}
          </>
        )}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        {t('createToken.title')}
      </p>
    </div>
  );
};