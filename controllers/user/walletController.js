const walletServices = require('../../services/user/walletServices');
const STATUS = require('../../constants/statusCode');

const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = req.session.user;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const result = await walletServices.getWalletTransactions(userId, page, 10);
    return res.render('user/wallet', {
      wallet: result.wallet,
      transactions: result.transactions,
      currentPage: result.page,
      totalPages: result.totalPages,
      user,
    });
  } catch (error) {
    console.log('Load wallet error', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR);
  }
};
module.exports = {
  loadWallet,
};
