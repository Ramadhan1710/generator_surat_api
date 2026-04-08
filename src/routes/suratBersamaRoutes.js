import express from "express";
import multer from "multer";
import { generateSuratController } from "../controllers/suratController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const suratTypes = [
    "surat-permohonan-pemateri",
    "surat-permohonan-peminjaman-alat",
    "surat-permohonan-izin-tempat",
    "surat-pemberitahuan",
    "surat-undangan",
    "surat-dispensasi",
    "surat-permohonan-konsumsi",
];

suratTypes.forEach((type) => {
    router.post(`/${type}`, upload.any(), generateSuratController);
});

export default router;