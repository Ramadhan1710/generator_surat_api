import path from "path";

const capitalizeEachWord = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const abbreviateWord = (str = "") => {
  return str
    .split(" ")             // pisah kata
    .map(word => word[0] || "") // ambil huruf pertama tiap kata
    .join("")               // gabungkan
    .toUpperCase();         // jadikan uppercase
};

const transformValue = (value, type) => {
  if (!value) return "";
  const str = String(value);
  switch (type) {
    case "uppercase":
      return str.toUpperCase();
    case "titlecase":
      return capitalizeEachWord(str);
    case "abbreviate":
      return abbreviateWord(str);
    default:
      return str;
  }
};

const fixPath = (filePath = "") =>
  filePath ? path.resolve(filePath).replace(/\\/g, "/") : null;

const formatImg = (typeSurat) => {
  switch (typeSurat) {
    case "surat_permohonan_pengesahan":
    case "surat_keputusan":
    case "berita_acara_pemilihan_ketua":
      return [120, 70];
    case "berita_acara_penyusunan_pengurus":
    case "berita_acara_formatur_pemilihan_ketua":
      return [100, 50];
    case "kartu_identitas":
      return [347, 208];
    case "sertifikat_kaderisasi":
      return [602, 425];
    case "curriculum_vitae":
      return [106, 151];
    default:
      return [120, 70];
  }
}

export const format = () => ({ transformValue, fixPath, capitalizeEachWord, formatImg });