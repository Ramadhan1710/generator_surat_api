import { SuratEntity } from "../domain/suratEntity.js";
import { generateDynamicSuratService } from "../services/generateDynamicSuratService.js";

export const generateSuratUseCase = async ({ type_surat, data, files, lembaga_name }) => {
  if (!type_surat) {
    throw new Error("Tipe surat harus diisi");
  }

  const surat = new SuratEntity(type_surat, data, files, lembaga_name);

  const fileBuffer = await generateDynamicSuratService(surat);

  return fileBuffer;
};