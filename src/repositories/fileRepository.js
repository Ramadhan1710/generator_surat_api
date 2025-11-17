import fs from 'fs';
import path from 'path';

export const saveFile = (fileName, buffer) => {
    const baseDir = process.env.VERCEL ? "/tmp/uploads" : path.join("src", "uploads");
    const uploadDir = baseDir;
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