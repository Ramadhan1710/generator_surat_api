import fs from "fs";
import path from "path";
import { fillDocxTemplate } from "./docxService.js";
import { buildTemplateData } from "./helpers/buildTemplateData.js";

export const generateDynamicSuratService = async (suratEntity) => {
  const { type_surat, data, files, lembaga_name } = suratEntity;

  console.log("Generating surat for:", type_surat, "of", lembaga_name);

  const configPath = path.join(
    "src/config/suratConfig",
    lembaga_name,
    `${type_surat}.json`
  );
  console.log("Config Path:", configPath);

  if (!fs.existsSync(configPath)) {
    throw new Error("Konfigurasi surat tidak ditemukan");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const templatePath = path.join(
    "src/templates",
    lembaga_name,
    config.template
  );

  const templateData = buildTemplateData(config, data, files);

  const buffer = fillDocxTemplate(templatePath, templateData, type_surat);

  return buffer;
};
