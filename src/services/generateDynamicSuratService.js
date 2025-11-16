import fs from "fs";
import os from "os";
import path from "path";
import { fillDocxTemplate } from "./docxService.js";
import { format } from "../utils/format.js";
import { buildTemplateData } from "./helpers/buildTemplateData.js";

// function buildTemplateData(fields, data) {
//   const result = {};

//   for (const field of fields) {
//     let value = data?.[field.name];

//     // ✅ Jika value berupa string JSON → auto-parse
//     if (typeof value === "string" && field.type === "array") {
//       try {
//         const parsed = JSON.parse(value);
//         console.log("Parsed JSON for field", field.name, ":", parsed);
//         value = parsed;
//       } catch {
//           // bukan JSON, biarkan tetap string
//       }
//     }

//     // 🔸 Validasi field wajib
//     if (
//       field.required &&
//       (value === undefined || value === null || value === "")
//     ) {
//       throw new Error(`Field ${field.name} wajib diisi`);
//     }

//     // 🔸 Kalau punya subfields → tangani nested data
//     if (field.fields && Array.isArray(value)) {
//       // contoh: "table" atau array of object
//       result[field.name] = value.map((item) =>
//         buildTemplateData(field.fields, item)
//       );
//     } else if (field.fields && typeof value === "object" && value !== null) {
//       // contoh: nested object biasa
//       result[field.name] = buildTemplateData(field.fields, value);
//     } else if (field.type === "file") {
//       // Untuk field file, kita simpan path-nya saja
//       result[field.name] = value || null;
//     } else {
//       if (typeof value === "number" && field.type === "text") {
//         value = value.toString();
//       }
//       result[field.name] = value;
//     }
//   }

//   return result;
// }

export const generateDynamicSuratService = async (suratEntity) => {
  const { type_surat, data, files, lembaga_name } = suratEntity;

  console.log("Generating surat for:", type_surat, "of", lembaga_name);

  // Menentukan path konfigurasi berdasarkan jenis lembaga dan tipe surat
  const configPath = path.join(
    "src/config/suratConfig",
    lembaga_name,
    `${type_surat}.json`
  );
  console.log("Config Path:", configPath);

  if (!fs.existsSync(configPath)) {
    throw new Error("Konfigurasi surat tidak ditemukan");
  }

  // Membaca konfigurasi surat
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  // Menentukan path template berdasarkan lembaga
  const templatePath = path.join("src/templates", lembaga_name, config.template);

  // Mempersiapkan data untuk template
  // const templateData = buildTemplateData(config.fields, data);

  // // Mengisi data sesuai konfigurasi
  // // for (const field of config.fields) {
  // //   const value = data[field.name] || "";
  // //   if (field.required && !value) {
  // //     throw new Error(`Field ${field.name} wajib diisi`);
  // //   }
  // //   templateData[field.name] = value;
  // // }

  // // Mengisi data tanda tangan digital jika ada
  // if (config.ttd) {
  //   for (const ttdField of config.ttd) {
  //     const file = files.find((f) => f.fieldname === ttdField.name);

  //     if (ttdField.required && !file) {
  //       throw new Error(
  //         `File tanda tangan untuk ${ttdField.name} wajib diunggah`
  //       );
  //     }

  //     if (!file) {
  //       templateData[ttdField.name] = null;
  //       continue;
  //     }

  //     // ✅ Jika file disimpan di local (diskStorage)
  //     if (file.path && fs.existsSync(file.path)) {
  //       templateData[ttdField.name] = file.path;
  //       continue;
  //     }

  //     // ✅ Jika file berasal dari memoryStorage (buffer)
  //     if (file.buffer) {
  //       const tempDir = os.tmpdir();
  //       const tempPath = path.join(
  //         tempDir,
  //         `${ttdField.name}-${Date.now()}.png`
  //       );

  //       fs.writeFileSync(tempPath, file.buffer);
  //       templateData[ttdField.name] = tempPath;

  //       // Opsional: bisa kamu simpan list file sementara untuk dihapus nanti
  //       // fs.unlink(tempPath, () => {}); // kalau mau langsung hapus async
  //     } else {
  //       templateData[ttdField.name] = null;
  //     }
  //   }
  // }

  // // hitung field computed jika ada
  // if (config.computedFields) {
  //   for (const compField of config.computedFields) {
  //     const sourceValue = templateData[compField.source] || "";
  //     templateData[compField.name] = format().transformValue(
  //       sourceValue,
  //       compField.transform
  //     );
  //   }
  // }

  const templateData = buildTemplateData(config, data, files);

  // Mengisi template dengan data
  const buffer = fillDocxTemplate(templatePath, templateData, type_surat);

  return buffer;
};
