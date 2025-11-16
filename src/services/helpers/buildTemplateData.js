import fs from "fs";
import path from "path";
import os from "os";
import { format } from "../../utils/format.js";

function buildTemplateData(config, data, files) {
  const result = {};

  const fields = config.fields;

  for (const field of fields) {
    let value = data?.[field.name];

    if (typeof value === "string" && field.type === "array") {
      try {
        const parsed = JSON.parse(value);
        // console.log("Parsed JSON for field", field.name, ":", parsed);
        value = parsed;
      } catch (error) {}
    }

    if (
      field.required &&
      (value === undefined || value === null || value === "") &&
      field.type !== "file"
    ) {
      throw new Error(`Field ${field.name} wajib diisi`);
    }

    if (field.fields && Array.isArray(value)) {
      result[field.name] = value.map((item) =>
        buildTemplateData({ fields: field.fields }, item, files)
      );
    } else if (field.fields && typeof value === "object" && value !== null) {
      result[field.name] = buildTemplateData(
        { fields: field.fields },
        value,
        files
      );
    } else if (field.type === "file") {
      console.log("Processing file field:", field.name);
      const file = files.find((f) => f.fieldname === field.name);

      if (file) {
        if (file.path && fs.existsSync(file.path)) {
          console.log(
            "Using existing file path for",
            field.name,
            ":",
            file.path
          );
          result[field.name] = file.path;
          continue;
        }

        if (file.buffer) {
          const tempPath = path.join(
            os.tmpdir(),
            `${Date.now()}_${file.originalname}`
          );
          fs.writeFileSync(tempPath, file.buffer);
          result[field.name] = tempPath;
          continue;
        }
      }

      // 2. path dikirim manual lewat Swagger
      if (value) {
        const abs = path.join(process.cwd(), value);

        if (fs.existsSync(abs)) {
          console.log("Using provided file path for", field.name, ":", abs);
          result[field.name] = abs;
          continue;
        }
      }

      // fallback jika semua gagal
      result[field.name] = null;
    } else {
      result[field.name] = value;
    }
  }

  if (config.ttd) {
    for (const ttdField of config.ttd) {
      const file = files.find((f) => f.fieldname === ttdField.name);

      if (ttdField.required && !file) {
        throw new Error(
          `File tanda tangan untuk ${ttdField.name} wajib diunggah`
        );
      }

      if (!file) {
        result[ttdField.name] = null;
        continue;
      }

      if (file.buffer) {
        const tempDir = os.tmpdir();
        const tempPath = path.join(
          tempDir,
          `${ttdField.name}-${Date.now()}.png`
        );
        fs.writeFileSync(tempPath, file.buffer);
        result[ttdField.name] = tempPath;
      } else {
        result[ttdField.name] = file.path;
      }
    }
  }

  if (config.computedFields) {
    for (const compField of config.computedFields) {
      const sourceValue = result[compField.source] || "";
      result[compField.name] = format().transformValue(
        sourceValue,
        compField.transform
      );
    }
  }

  return result;
}

export { buildTemplateData };
