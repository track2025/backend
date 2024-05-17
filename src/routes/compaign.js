const express = require('express');
const router = express.Router();
const compaign = require('../controllers/compaign');

// Import verifyToken function
const verifyToken = require('../config/jwt');

router.get('/admin/compaigns', verifyToken, compaign.getAdminCompaigns);
router.get(
  '/admin/compaigns/:slug',
  verifyToken,
  compaign.getOneCompaignByAdmin
);

router.post('/admin/compaigns', verifyToken, compaign.createCompaign);

router.put(
  '/admin/compaigns/:slug',
  verifyToken,
  compaign.updateOneCompaignByAdmin
);

router.delete(
  '/admin/compaigns/:cid',
  verifyToken,
  compaign.deleteOneCompaignByAdmin
);
router.get('/compaigns', compaign.getCompaignsByUser);

module.exports = router;
