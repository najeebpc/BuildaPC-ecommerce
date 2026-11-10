const Wallet = require('../../model/walletSchema');
const WalletTransaction = require('../../model/walletTransactionSchema');
const MESSAGES = require('../../constants/messages');

const getOrCreateWallet = async (userId, session = null) => {
  let query = Wallet.findOne({ userId });
  if (session) {
    query = query.session(session);
  }
  let wallet = await query;
  if (wallet) {
    return wallet;
  }
  const options = session ? { session } : {};
  const createdWallets = await Wallet.create([{ userId, balance: 0 }], options);
  return createdWallets[0];
};

const getWalletTransactions = async (userId, page = 1, limit = 5) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(50, Math.max(1, Number(limit) || 5));

  const wallet = await getOrCreateWallet(userId);

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    WalletTransaction.countDocuments({
      walletId: wallet._id,
    }),
  ]);

  return {
    wallet,
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
const changeWalletBalance = async ({
  userId,
  type,
  amount,
  description,
  orderId = null,
  referenceId = null,
  session,
}) => {
  if (!session) {
    throw new Error(MESSAGES.WALLET_TRANSACTION_FAILED);
  }
  if (!['credit', 'debit'].includes(type)) {
    throw new Error(MESSAGES.WALLET_INVALID_TRANSACTION_TYPE);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(MESSAGES.WALLET_INVALID_AMOUNT);
  }
  if (!description || !description.trim()) {
    throw new Error(MESSAGES.WALLET_TRANSACTION_DESCRIPTION_REQUIRED);
  }
  const wallet = await getOrCreateWallet(userId, session);
  let updatedWallet;
  if (type === 'debit') {
    updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: wallet._id,
        balance: { $gte: amount },
      },
      {
        $inc: { balance: -amount },
      },
      {
        new: true,
        session,
        runValidators: true,
      },
    );
    if (!updatedWallet) {
      throw new Error(MESSAGES.WALLET_INSUFFICIENT_BALANCE);
    }
  } else {
    updatedWallet = await Wallet.findByIdAndUpdate(
      wallet._id,
      {
        $inc: { balance: amount },
      },
      {
        new: true,
        session,
        runValidators: true,
      },
    );

    if (!updatedWallet) {
      throw new Error(MESSAGES.WALLET_NOT_FOUND);
    }
  }
  await WalletTransaction.create(
    [
      {
        walletId: updatedWallet._id,
        userId,
        type,
        amount,
        description: description.trim(),
        balanceAfter: updatedWallet.balance,
        orderId,
        referenceId,
      },
    ],
    { session },
  );

  return updatedWallet;
};
module.exports = {
  getOrCreateWallet,
  getWalletTransactions,
  changeWalletBalance,
};
