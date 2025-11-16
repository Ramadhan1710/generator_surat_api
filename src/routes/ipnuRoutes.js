import express from "express";
import multer from "multer";
import { generateSuratController } from "../controllers/suratController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const suratTypes = [
    "surat-permohonan-pengesahan",
    "berita-acara-pemilihan",
    "surat-keputusan",
    "susunan-pengurus",
    "kartu-identitas",
    "sertifikat-kaderisasi",
    "curiculum-vitae"
];

suratTypes.forEach((type) => {
    router.post(`/${type}`, upload.any(), generateSuratController);
});

export default router;