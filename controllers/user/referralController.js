const referralService = require('../../services/user/referralServices');
const ReferralHistory = require('../../model/referralSchema');

const loadReferralPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const referralCode = await referralService.getReferralCode(userId);
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const referralLink = `${baseUrl}/signup?ref=${referralCode}`;
    const referrals = await ReferralHistory.find({ referrerId: userId })
      .populate('referredUserId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    const totalReferrals = referrals.length;
    const rewardedReferrals = referrals.filter((referral) => referral.status === 'rewarded').length;
    res.render('user/referral', {
      user: req.session.user,
      referralCode,
      referralLink,
      referrals,
      totalReferrals,
      rewardedReferrals,
    });
  } catch (error) {
    console.log('load referral error', error);
    res.render('user/referral');
  }
};
module.exports = {
  loadReferralPage,
};
