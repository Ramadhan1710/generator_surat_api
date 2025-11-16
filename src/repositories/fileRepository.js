import fs from 'fs';
import path from 'path';

export const saveFile = (fileName, buffer) => {
    const uploadDir = path.join("src/uploads");
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

export const readFile = (filePath) => {
    if (!fs.existsSync(filePath)){
        throw new Error("File tidak ditemukan");
    }
    return fs.readFileSync(filePath, "binary");
}