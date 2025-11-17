import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import fs from "fs";
import { format } from "../utils/format.js";

export const fillDocxTemplate = (templatePath, data, typeSurat) => {
  const content = fs.readFileSync(templatePath);

  const zip = new PizZip(content);

  const imageSize = format().formatImg(typeSurat);

  const imageModule = new ImageModule({
    getImage: (tagValue) => {
      return fs.readFileSync(tagValue);
    },
    getSize: (img, tagValue) => {
      return imageSize;
    },
    centered: true,
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule],
  });

  for (const key in data) {
    if (key.startsWith("ttd_") && typeof data[key] === "string") {
      data[key] = data[key].replace(/\\/g, "/");
    }
  }

  // console.log("Data to fill:", data);

  doc.render(data);

  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  return buffer;
};
