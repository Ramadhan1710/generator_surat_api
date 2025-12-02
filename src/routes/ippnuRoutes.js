import express from "express";
import multer from "multer";
import { generateSuratController } from "../controllers/suratController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const suratTypes = [
    "surat-permohonan-pengesahan",
    "berita-acara-pemilihan-ketua",
    "berita-acara-formatur-pembentukan-pengurus-harian",
    "berita-acara-penyusunan-pengurus",
    "surat-keputusan",
    "susunan-pengurus",
    "kartu-identitas",
    "sertifikat-kaderisasi",
    "curriculum-vitae"
];

suratTypes.forEach((type) => {
    router.post(`/${type}`, upload.any(), generateSuratController);
});

export default router;