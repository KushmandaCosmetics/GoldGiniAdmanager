import { prisma } from './prisma';

export async function processCpcCharge(campaignId: number, cpcAmount: number) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch Campaign and Wallet with lock (Prisma doesn't support raw FOR UPDATE easily in all DBs, 
      // but we do sequential checks inside a transaction block)
      const campaign = await tx.campaign.findUnique({ 
        where: { id: campaignId },
        include: { seller: true }
      });

      if (!campaign || campaign.status !== 'ACTIVE') {
        throw new Error('Campaign inactive or not found');
      }

      const wallet = await tx.sellerWallet.findUnique({
        where: { sellerId: campaign.sellerId }
      });

      if (!wallet) throw new Error('Wallet not found');

      // 2. Check if they have enough balance and haven't exceeded daily budget
      const newSpentToday = Number(campaign.spentToday) + cpcAmount;
      const newTotalSpent = Number(campaign.totalSpent) + cpcAmount;
      
      if (Number(wallet.balance) < cpcAmount) {
        // Out of funds completely
        await tx.campaign.update({
          where: { id: campaignId },
          data: { status: 'PAUSED' }
        });
        throw new Error('Insufficient wallet balance. Campaign paused.');
      }

      // 3. Deduct from wallet
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - cpcAmount;

      await tx.sellerWallet.update({
        where: { sellerId: campaign.sellerId },
        data: { balance: balanceAfter }
      });

      // 4. Log Transaction
      await tx.walletTransaction.create({
        data: {
          sellerId: campaign.sellerId,
          type: 'CPC_DEDUCTION',
          amount: -cpcAmount,
          description: `CPC charge for campaign #${campaignId}`,
          referenceId: `CPC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          balanceBefore,
          balanceAfter
        }
      });

      // 5. Update Campaign Spend & Check Budget Exhaustion
      let newStatus = campaign.status;
      if (newSpentToday >= Number(campaign.dailyBudget)) {
        newStatus = 'BUDGET_EXHAUSTED';
      }

      await tx.campaign.update({
        where: { id: campaignId },
        data: { 
          spentToday: newSpentToday,
          totalSpent: newTotalSpent,
          status: newStatus
        }
      });
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Billing processing failed:', error.message);
    return { success: false, error: error.message };
  }
}
