import fs from "fs";
import path from "path";
import { fillDocxTemplate } from "./docxService.js";
import { buildTemplateData } from "./helpers/buildTemplateData.js";

export const generateDynamicSuratService = async (suratEntity) => {
  const { type_surat, data, files, jenis_surat } = suratEntity;

  console.log("Generating surat for:", type_surat, "of", jenis_surat);

  const configPath = path.join(
    "src/config/suratConfig",
    jenis_surat,
    `${type_surat}.json`
  );
  console.log("Config Path:", configPath);

  if (!fs.existsSync(configPath)) {
    throw new Error("Konfigurasi surat tidak ditemukan");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  console.log("Config Loaded:", config);

  const templatePath = path.join(
    "src/templates",
    jenis_surat,
    config.template
  );

  const templateData = buildTemplateData(config, data, files);

  const buffer = fillDocxTemplate(templatePath, templateData, type_surat);

  return buffer;
};
