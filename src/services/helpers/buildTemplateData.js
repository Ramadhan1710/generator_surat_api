import fs from "fs";
import path from "path";
import os from "os";
import { format } from "../../utils/format.js";

function buildTemplateData(config, data, files, parentPath = "") {
  const result = {};

  const fields = config.fields || [];

  for (const field of fields) {
    let value = data?.[field.name];

    // Parsing untuk array
    if (field.type === "array" && typeof value === "string") {
      try {
        value = JSON.parse(value);
        // console.log("Parsed JSON for array field", field.name, ":", value);
      } catch (error) {
        // console.error(`Failed to parse array field ${field.name}:`, error);
        value = [];
      }
    }

    if (field.type === "boolean") {
      value = JSON.parse(value);
    }

    // Validasi required
    if (
      field.required &&
      (value === undefined || value === null || value === "") &&
      field.type !== "file"
    ) {
      throw new Error(`Field ${field.name} wajib diisi`);
    }

    // Nested fields (array)
    if (field.fields && field.type === "array") {
      const arrayValue = Array.isArray(value) ? value : [];

      const baseArray = arrayValue.map((item, index) => {
        // Format untuk Flutter: field_name[index] (tanpa parent path untuk array level 1)
        const itemPath = `${field.name}[${index}]`;
        return buildTemplateData({ fields: field.fields }, item, files, itemPath);
      });

      const orgFields = {
        organisasi_ketua: "no_organisasi_ketua",
        organisasi_sekretaris: "no_organisasi_sekretaris",
        organisasi_bendahara: "no_organisasi_bendahara",
      };

      if (orgFields[field.name]) {
        result[field.name] = baseArray;
        result[orgFields[field.name]] = baseArray.length === 0;
      }

      if (field.name === "pembina") {
        result[field.name] = baseArray.map((item, index) => {
          const no = index + 1;
          const text = `${no}. ${item.nama || item.name}`;
          return {
            ...item,
            no,
            text,
            isBold: index === 0,
          };
        });
      } else if (field.name === "pengurus_harian") {
        // Sorting pengurus berdasarkan prioritas jabatan
        const priorityMap = {
          ketua: 1,
          sekretaris: 2,
          "wakil ketua i": 3,
          "wakil ketua 1": 3,
          "wakil sekretaris i": 4,
          "wakil sekretaris 1": 4,
          "wakil ketua ii": 5,
          "wakil ketua 2": 5,
          "wakil sekretaris ii": 6,
          "wakil sekretaris 2": 6,
          bendahara: 7,
          "wakil bendahara": 8,
        };

        const sortedArray = baseArray.sort((a, b) => {
          const jabatanA = (a.jabatan || "").toLowerCase();
          const jabatanB = (b.jabatan || "").toLowerCase();
          const priorityA = priorityMap[jabatanA] || 99;
          const priorityB = priorityMap[jabatanB] || 99;
          return priorityA - priorityB;
        });

        // Konversi ke format 2 kolom (rows) - FLATTEN untuk template
        const rows = [];
        for (let i = 0; i < sortedArray.length; i += 2) {
          const leftItem = sortedArray[i];
          const rightItem = sortedArray[i + 1];

          rows.push({
            // Kolom Kiri (flatten)
            jabatan: leftItem?.jabatan || "",
            nama: leftItem?.nama || "",
            ttd: leftItem?.ttd || null,

            // Kolom Kanan (flatten dengan prefix)
            jabatan_right: rightItem?.jabatan || "",
            nama_right: rightItem?.nama || "",
            ttd_right: rightItem?.ttd || null,

            // Flags
            hasRight: !!rightItem,
            isOddRow: !rightItem, // true jika kolom kanan kosong
          });
        }

        result[field.name] = sortedArray; // array asli (sorted)
        result[`${field.name}_rows`] = rows; // format 2 kolom untuk template
      } else if (field.name === "tim_formatur") {
        const priorityMap = {
          "ketua terpilih": 1,
          "ketua demisioner": 2,
        };

        const sortedArray = baseArray.sort((a, b) => {
          const jabatanA = (a.jabatan || "").toLowerCase();
          const jabatanB = (b.jabatan || "").toLowerCase();
          const priorityA = priorityMap[jabatanA] || 99;
          const priorityB = priorityMap[jabatanB] || 99;
          return priorityA - priorityB;
        });

        // Pisahkan Ketua dari yang lain
        const ketuaItem = sortedArray.find(
          (item) => (item.jabatan || "").toLowerCase() === "ketua terpilih"
        );
        const othersArray = sortedArray.filter(
          (item) => (item.jabatan || "").toLowerCase() !== "ketua terpilih"
        );

        const rows = [];

        // Row 1: Ketua (full width, merged)
        if (ketuaItem) {
          rows.push({
            jabatan: ketuaItem.jabatan || "",
            nama: ketuaItem.nama || "",
            ttd: ketuaItem.ttd || null,
            jabatan_right: "",
            nama_right: "",
            ttd_right: null,
            hasRight: false,
            isOddRow: false,
            isKetuaRow: true,
          });
        }

        // Row 2+: Ketua Demisioner & Anggota (zigzag 2 kolom)
        for (let i = 0; i < othersArray.length; i += 2) {
          const leftItem = othersArray[i];
          const rightItem = othersArray[i + 1];

          rows.push({
            jabatan: leftItem?.jabatan || "",
            nama: leftItem?.nama || "",
            ttd: leftItem?.ttd || null,
            jabatan_right: rightItem?.jabatan || "",
            nama_right: rightItem?.nama || "",
            ttd_right: rightItem?.ttd || null,
            hasRight: !!rightItem,
            isOddRow: !rightItem, // true jika baris terakhir ganjil
            isKetuaRow: false,
          });
        }

        result[field.name] = sortedArray; // array asli (sorted)
        result[`${field.name}_rows`] = rows; // format rows untuk template

        console.log("Tim Formatur processed:", result[`${field.name}_rows`]);
      } else {
        result[field.name] = baseArray;
      }

      continue;
    }

    // Nested object
    if (field.fields && typeof value === "object" && value !== null) {
      // Untuk nested object, gunakan dot notation
      const objectPath = parentPath ? `${parentPath}[${field.name}]` : field.name;
      result[field.name] = buildTemplateData(
        { fields: field.fields },
        value,
        files,
        objectPath
      );
      continue;
    }

    // File handling
    if (field.type === "file") {
      // Cek apakah ini nested field (ada parentPath)
      // Format dari Flutter: field_name[index][subfield] atau field_name untuk root level
      const fullFieldName = parentPath ? `${parentPath}[${field.name}]` : field.name;
      
      const file = files.find((f) => f.fieldname === fullFieldName || f.fieldname === field.name);

      // Debug logging untuk file di dalam array
      if (parentPath) {
        console.log(`Looking for file: ${fullFieldName}, Found:`, file ? file.fieldname : 'NOT FOUND');
      }

      if (file) {
        if (file.path && fs.existsSync(file.path)) {
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

      if (value) {
        const abs = path.join(process.cwd(), value);
        if (fs.existsSync(abs)) {
          result[field.name] = abs;
          continue;
        }
      }

      result[field.name] = null;
      continue;
    }

    // Default
    result[field.name] = value;
  }

  // Tanda tangan
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
        const tempPath = path.join(
          os.tmpdir(),
          `${ttdField.name}-${Date.now()}.png`
        );
        fs.writeFileSync(tempPath, file.buffer);
        result[ttdField.name] = tempPath;
      } else {
        result[ttdField.name] = file.path;
      }
    }
  }

  // Computed fields
  if (config.computedFields) {
    for (const compField of config.computedFields) {
      const sourceValue = result[compField.source] || "";
      result[compField.name] = format().transformValue(
        sourceValue,
        compField.transform
      );
    }
  }

  // Deteksi apakah ada wakil sekretaris
  if (result.wakil_sekre && Array.isArray(result.wakil_sekre)) {
    result.wakil_sekre.forEach((ws, index) => {
      result[`wakil_sekre${index + 1}`] = ws;
      result[`hasWakilSekre${index + 1}`] = true;
    });
    result.hasWakilSekre = result.wakil_sekre.length > 0;
    console.log("Wakil Sekretaris detected:", result.wakil_sekre);
  }

  // Deteksi apakah ada wakil bendahara
  if (result.nama_wakil_bend) {
    result.hasWakilBend = true;
  }

  return result;
}

export { buildTemplateData };
