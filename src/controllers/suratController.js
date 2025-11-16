import { generateSuratUseCase } from "../usecases/suratUseCase.js";
import fs from "fs";

export const generateSuratController = async (req, res) => {
  try {
    const { type_surat, lembaga_name, ...data } = req.body;

    const buffer = await generateSuratUseCase({
      type_surat,
      data,
      files: req.files,
      lembaga_name,
    });

    const fileName = type_surat.replace(/_/g, " ").toUpperCase();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}.docx`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTypeSuratController = (req, res) => {
  try {
    const typeSuratConfigPath = `src/config/suratConfig/type_surat.json`;
    const typeSuratConfig = JSON.parse(
      fs.readFileSync(typeSuratConfigPath, "utf-8")
    );
    res.json({ types: typeSuratConfig.types });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
