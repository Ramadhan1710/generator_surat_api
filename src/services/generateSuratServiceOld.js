import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import sizeOf from "image-size";

export const generateSurat = async (data) => {
  const templatePath = path.resolve("src/templates/template_surat.docx");
  const content = fs.readFileSync(templatePath, "binary");

  const zip = new PizZip(content);

  const imageOpts = {
    centered: true,

    getImage: (tagValue) => {
      const fixedPath = path.resolve(tagValue).replace(/\\/g, "/");
      return fs.readFileSync(fixedPath);
    },

    getSize: () => {
      return [150, 75];
    }, 
  };

  const doc = new Docxtemplater(zip, { modules: [new ImageModule(imageOpts)] });

  const fixPath = (filePath) => {
    if (!filePath) return null;
    return path.resolve(filePath).replace(/\\/g, "/");
  };

  doc.render({
    nama_lembaga_upper: data.nama_lembaga.toUpperCase(),
    nama_lembaga_title: capitalizeEachWord(data.nama_lembaga),  
    alamat: data.alamat,
    email: data.email,
    nomor_surat: data.nomor_surat,
    tanggal_hijriah: data.tanggal_hijriah,
    tanggal_masehi: data.tanggal_masehi,
    periode: data.periode,
    ttd_ketua: fixPath(data.ttd_ketua),
    ttd_sekretaris: fixPath(data.ttd_sekretaris),
    nama_ketua: data.nama_ketua,
    nama_sekretaris: data.nama_sekretaris,
  });

  const buffer = doc.getZip().generate({ type: "nodebuffer" });
  const outputPath = `src/uploads/surat_${Date.now()}.docx`;
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};

function capitalizeEachWord(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
