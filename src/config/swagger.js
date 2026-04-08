import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

const suratBasePath = "src/config/suratConfig";
const pathsObj = {};

// =======================
// HELPER FUNCTIONS
// =======================

// 🔹 Parse JSON aman
function safeParseJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`⚠️ Gagal parse JSON di ${filePath}: ${err.message}`);
    return null;
  }
}

// 🔹 Format route & title
const formatRouteType = (typeName) => typeName.replace(/_/g, "-");
const formatTitle = (typeName) =>
  typeName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toLowerCase());

// 🔹 Build property Swagger
function buildSwaggerProperty(field) {
  const base = {
    description: field.label || field.name,
    example: field.example || field.helpText || "",
  };

  // Nested fields (object / array)
  if (field.fields && Array.isArray(field.fields)) {
    if (["table", "array"].includes(field.type)) {
      return {
        ...base,
        type: "array",
        items: {
          type: "object",
          properties: Object.fromEntries(
            field.fields.map((sub) => [sub.name, buildSwaggerProperty(sub)]),
          ),
        },
        example: field.example,
      };
    }

    return {
      ...base,
      type: "object",
      properties: Object.fromEntries(
        field.fields.map((sub) => [sub.name, buildSwaggerProperty(sub)]),
      ),
    };
  }

  // File upload
  if (field.format === "binary" || field.type === "file") {
    return { ...base, type: "string", format: "binary" };
  }

  // Validasi type
  const validTypes = ["string", "number", "integer", "boolean"];
  return {
    ...base,
    type: validTypes.includes(field.type) ? field.type : "string",
  };
}

// 🔹 Gabungkan semua field
function buildAllFields(jenisSurat, typeName, config) {
  return [
    {
      name: "jenis_surat",
      type: "string",
      required: true,
      example: jenisSurat,
      label: "Jenis Surat (IPNU, IPPNU, Bersama)",
    },
    {
      name: "type_surat",
      type: "string",
      required: true,
      example: typeName,
      label: "Jenis template surat",
    },
    ...(config.fields || []),
    ...(config.ttd || []).map((t) => ({
      ...t,
      type: "string",
      format: "binary",
    })),
  ];
}

// 🔹 Ambil required fields
const getRequiredFields = (fields) =>
  fields.filter((f) => f.required).map((f) => f.name);

// 🔹 Build response sukses
function buildSuccessResponse() {
  return {
    description: "Surat berhasil dibuat",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Surat berhasil dibuat",
            },
            fileUrl: {
              type: "string",
              example: "/uploads/surat.docx",
            },
          },
        },
      },
    },
  };
}

// =======================
// MAIN GENERATOR
// =======================

function generateSwaggerPaths() {
  const paths = {};

  const jenisSuratList = fs.readdirSync(suratBasePath);
  console.log("Jenis Surat Ditemukan:", jenisSuratList);

  for (const jenisSurat of jenisSuratList) {
    const jenisSuratDir = path.join(suratBasePath, jenisSurat);

    if (!fs.lstatSync(jenisSuratDir).isDirectory()) continue;

    const files = fs.readdirSync(jenisSuratDir);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const configPath = path.join(jenisSuratDir, file);
      const config = safeParseJSON(configPath);
      if (!config) continue;

      const typeName = path.basename(file, ".json");

      const routeType = formatRouteType(typeName);
      const title = formatTitle(typeName);
      const routePath = `/api/surat/${jenisSurat}/${routeType}`;

      const allFields = buildAllFields(jenisSurat, typeName, config);
      const requiredFields = getRequiredFields(allFields);

      const properties = Object.fromEntries(
        allFields.map((f) => [f.name, buildSwaggerProperty(f)]),
      );

      paths[routePath] = {
        post: {
          summary: `Generate Surat: ${title} (${jenisSurat})`,
          tags: [`Surat - ${jenisSurat}`],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: requiredFields,
                  properties,
                },
              },
            },
          },
          responses: {
            200: buildSuccessResponse(),
            400: { description: "Data tidak valid" },
            500: { description: "Gagal membuat surat" },
          },
        },
      };
    }
  }

  return paths;
}

// =======================
// SWAGGER SETUP
// =======================

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Surat Generator API",
      version: "1.0.0",
      description:
        "API untuk generate surat menggunakan template DOCX dengan tanda tangan digital",
    },
    servers: [
      {
        url: "https://generator-surat-api.fly.dev",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    paths: generateSwaggerPaths(),
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
