import express from "express";
import multer from "multer";
import { generateSurat } from "../services/generateSuratService.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = uuidv4() + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
router.post(
  "/generate",
  upload.fields([{ name: "ttd_ketua" }, { name: "ttd_sekretaris" }]),
  async (req, res) => {
    try {
      const data = {
        ...req.body,
        ttd_ketua: req.files["ttd_ketua"]?.[0]?.path,
        ttd_sekretaris: req.files["ttd_sekretaris"]?.[0]?.path,
      };

      const filePath = await generateSurat(data);

      const publicUrl = `/uploads/${path.basename(filePath)}`;
      res.json({
        message: "Surat berhasil dibuat", 
        filePath,
        fileUrl: publicUrl,
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Gagal membuat surat", error: err.message });
    }
  }
);

export default router;
 