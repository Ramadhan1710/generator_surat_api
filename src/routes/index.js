import express from 'express';
import ipnuRoutes from './ipnuRoutes.js';
import ippnuRoutes from './ippnuRoutes.js';
import suratRoutes from './suratRoutes.js';
import suratBersamaRoutes from './suratBersamaRoutes.js';

const router = express.Router();

router.use('/surat/ipnu', ipnuRoutes);
router.use('/surat/ippnu', ippnuRoutes);
router.use('/surat/bersama', suratBersamaRoutes);
router.use('/surat', suratRoutes);

export default router;