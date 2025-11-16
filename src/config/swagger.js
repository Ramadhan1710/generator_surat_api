import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

const suratBasePath = "src/config/suratConfig";
const pathsObj = {};

function flattenArrayFields(field, maxItems = 10) {
  const result = {};

  for (let i = 0; i < maxItems; i++) {
    for (const sub of field.fields) {
      const key = `${field.name}[${i}][${sub.name}]`;
      result[key] = buildSwaggerProperty(sub);
    }
  }

  return result;
}

function buildSwaggerProperty(field) {
  const base = {
    description: field.label || field.name,
    example: field.example || field.helpText || "",
  };

  // Kalau ada subfields
  if (field.fields && Array.isArray(field.fields)) {
    // Jika type array/table → array of object
    if (["table", "array"].includes(field.type)) {
      return {
        description: field.label || field.name,
        type: "array",
        items: {
          type: "object",
          properties: Object.fromEntries(
            field.fields.map((sub) => [sub.name, buildSwaggerProperty(sub)])
          ),
        },
        example: field.example,
      };
    }

    // Kalau type object
    return {
      ...base,
      type: "object",
      properties: Object.fromEntries(
        field.fields.map((sub) => [sub.name, buildSwaggerProperty(sub)])
      ),
    };
  }

  // Field file upload
  if (field.format === "binary" || field.type === "file") {
    return { ...base, type: "string", format: "binary" };
  }

  // Pastikan type valid
  const validTypes = [
    "string",
    "number",
    "integer",
    "boolean",
    "array",
    "object",
  ];
  const fieldType = validTypes.includes(field.type) ? field.type : "string";

  return {
    ...base,
    type: fieldType,
  };
}

for (const lembaga of fs.readdirSync(suratBasePath)) {
  const lembagaDir = path.join(suratBasePath, lembaga);
  if (!fs.lstatSync(lembagaDir).isDirectory()) continue;

  const files = fs.readdirSync(lembagaDir);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const configPath = path.join(lembagaDir, file);
    const raw = fs.readFileSync(configPath, "utf-8");
    if (!raw.trim()) continue; // skip JSON kosong

    let config;
    try {
      config = JSON.parse(raw);
    } catch (err) {
      console.warn(`⚠️  Gagal parse JSON di ${configPath}:`, err.message);
      continue;
    }

    const typeName = path.basename(file, ".json");

    const routeType = typeName.replace(/_/g, "-");
    const title = typeName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toLowerCase());
    const routePath = `/api/surat/${lembaga}/${routeType}`;

    // 🔹 gabungkan lembaga, typeSurat, fields dan ttd jadi satu schema
    const allFields = [
      {
        name: "lembaga_name",
        type: "string",
        required: true,
        example: lembaga,
        label: "Lembaga (misal: IPNU, IPPNU, dll)",
      },
      {
        name: "type_surat",
        type: "string",
        required: true,
        example: typeName,
        label: "Jenis surat (misal: surat_permohonan_pengesahan)",
      },
      ...(config.fields || []),
      ...(config.ttd || []).map((t) => ({
        ...t,
        type: "string",
        format: "binary", // penting biar swagger tahu ini file upload
      })),
    ];

    // 🔹 kumpulkan required fields
    const requiredFields = allFields
      .filter((f) => f.required)
      .map((f) => f.name);

    // 🔹 bikin properties untuk swagger
    // const properties = Object.fromEntries(
    //   allFields.map((f) => [
    //     f.name,
    //     {
    //       type: f.type || "string",
    //       format: f.format,
    //       description: f.label || f.name,
    //       example: f.example || f.helpText || "",
    //     },
    //   ])
    // );

    const properties = Object.fromEntries(
      allFields.map((f) => [f.name, buildSwaggerProperty(f)])
    );

    pathsObj[routePath] = {
      post: {
        summary: `Generate Surat: ${title} (${lembaga})`,
        tags: [`Surat - ${lembaga}`],
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
          200: {
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
                      example: "/uploads/surat_permohonan_pengesahan.docx",
                    },
                  },
                },
              },
            },
          },
          400: { description: "Data tidak valid" },
          500: { description: "Gagal membuat surat" },
        },
      },
    };
  }
}

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
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    paths: pathsObj,
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
