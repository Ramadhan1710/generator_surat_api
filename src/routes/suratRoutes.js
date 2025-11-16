import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import {
  generateSuratController,
  getAllTypeSuratController,
} from "../controllers/suratController.js";
import { getTypeSuratController } from "../controllers/typeSuratController.js";

const router = express.Router();

/**
 * @swagger
 * /api/surat/types:
 *   get:
 *     summary: Mendapatkan semua jenis surat
 *     tags:
 *       - Surat
 *     responses:
 *       200:
 *         description: Daftar jenis surat berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 types:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Surat Permohonan Pengesahan
 *                       value:
 *                         type: string
 *                         example: surat_permohonan_pengesahan
 */
router.get("/types", getAllTypeSuratController);

/**
 * @swagger
 * /api/surat/types/{lembaga}/{typeSurat}:
 *   get:
 *     summary: Mendapatkan konfigurasi untuk jenis surat tertentu
 *     tags:
 *       - Surat
 *     parameters:
 *       - in: path
 *         name: typeSurat
 *         required: true
 *         schema:
 *           type: string
 *           description: "Nama file JSON type surat (misal: 'berita_acara_pemilihan_ketua')"
 *       - in: path
 *         name: lembaga
 *         required: true
 *         schema:
 *           type: string
 *         description: "Nama lembaga/organisasi (misal: 'IPNU' atau 'IPPNU')"
 *     responses:
 *       200:
 *         description: "Konfigurasi type surat berhasil diambil"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 typeSurat:
 *                   type: object
 *                   description: "Isi file JSON type surat"
 *                   example:
 *                     types:
 *                       - name: "Berita Acara Pemilihan Ketua"
 *                         value: "berita_acara_pemilihan_ketua"
 *                     lembaga:
 *                       - name: "IPNU"
 *                         value: "IPNU"
 *                       - name: "IPPNU"
 *                         value: "IPPNU"
 *       500:
 *         description: "Terjadi kesalahan saat membaca file"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ENOENT: no such file or directory, open 'src/config/suratConfig/xyz.json'"
 */
router.get("/types/:lembaga/:typeSurat", getTypeSuratController);

export default router;
