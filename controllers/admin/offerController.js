const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const offerServices = require('../../services/admin/offerServices');
const MESSAGES = require('../../constants/messages');

const loadOffers = async (req, res) => {
    try {
        const [offers, products,categories] = await Promise.all([
            offerServices.getAllOffers(),
            Product.find({
                isListed:true,
                isDeleted:false,
            }).select('name'),
            Category.find({
                isListed:true,
                isDeleted:false
            }).select('name')
        ]);
        return res.render('admin/offers', {
            offers,
            products,
            categories,
            admin:req.session.admin,
            message: null
        });
    } catch (error) {
        console.error('Load offers error:', error);
        return res.status(500).render('admin/offers', {
            offers: [],
            message: error.message
        });
    }
};
const createOffer = async (req, res) => {
    try {
        await offerServices.createOffer(req.body);
        return res.status(200).json({
            success:true,
            message:MESSAGES.OFFER_CREATED
        })
    } catch (error) {
        console.error('Create offer error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateOffer = async (req, res) => {
    try {
        await offerServices.updateOffer(req.params.offerId, req.body);
        return res.status(200).json({
            success:true,
            message:MESSAGES.OFFER_UPDATED
        });
    } catch (error) {
        console.error('Update offer error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const updateOfferStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: MESSAGES.OFFER_STATUS_INVALID
            });
        }
        await offerServices.updateOfferStatus(
            req.params.offerId,
            isActive
        );
        return res.status(200).json({
            success:true,
            message:MESSAGES.OFFER_STATUS_UPDATED
        });
    } catch (error) {
        console.error('Update offer status error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const deleteOffer = async (req, res) => {
    try {
        await offerServices.deleteOffer(req.params.offerId);

        return res.status(200).json({
            success:true,
            message:MESSAGES.OFFER_DELETED
        })
    } catch (error) {
        console.error('Delete offer error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    loadOffers,
    createOffer,
    updateOffer,
    updateOfferStatus,
    deleteOffer
};
