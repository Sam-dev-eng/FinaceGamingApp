package com.financegaming.engine;

/**
 * Credit score rules for bank borrowing and loan repayment behaviour.
 */
public final class CreditScoreLogic {

    private CreditScoreLogic() {
    }

    public static int clamp(int score) {
        return Math.max(GameConstants.MIN_CREDIT_SCORE, Math.min(GameConstants.MAX_CREDIT_SCORE, score));
    }

    public static boolean canBorrow(int creditScore) {
        return creditScore > GameConstants.MIN_CREDIT_SCORE_TO_BORROW;
    }

    /** After a voluntary loan payment (any amount &gt; 0). */
    public static int afterLoanPayment(
            int currentScore,
            long amountPaid,
            long minimumPayment,
            long loanBefore,
            long loanAfter
    ) {
        if (amountPaid <= 0) {
            return currentScore;
        }
        if (loanAfter <= 0) {
            return clamp(currentScore + 50);
        }
        if (amountPaid > minimumPayment) {
            return clamp(currentScore + 25);
        }
        if (amountPaid >= minimumPayment) {
            return clamp(currentScore + 15);
        }
        // Partial payment below minimum — still responsible, small bump
        return clamp(currentScore + 5);
    }

    /** Skipping the loan phase entirely this round. */
    public static int afterSkipLoan(int currentScore) {
        return clamp(currentScore - 30);
    }

    /** Taking on new bank debt — small penalty for increased leverage. */
    public static int afterBorrow(int currentScore) {
        return clamp(currentScore - 5);
    }
}
