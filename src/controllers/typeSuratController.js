import fs from "fs";

export const getAllTypeSuratController = (req, res) => {
  try {
    const typeSuratConfigPath = `src/config/suratConfig/type_surat.json`;
    const typeSuratConfig = JSON.parse(
      fs.readFileSync(typeSuratConfigPath, "utf-8")
    );
    res.json({
      types: typeSuratConfig.types,
      lembaga: typeSuratConfig.lembaga,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTypeSuratController = (req, res) => {
  try {
    const typeSurat = req.params.typeSurat;
    const lembaga = req.params.lembaga;

    const typeSuratConfigPath = `src/config/suratConfig/${lembaga}/${typeSurat}.json`;
    const typeSuratConfig = JSON.parse(
      fs.readFileSync(typeSuratConfigPath, "utf-8")
    );
    res.json({ typeSurat: typeSuratConfig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};