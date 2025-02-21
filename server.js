// Cargar variables de entorno desde un archivo .env (para desarrollo)
// En producción, Render usará las variables de entorno configuradas en su panel.
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const XlsxPopulate = require("xlsx-populate");

const { Client } = require("pg");

const app = express();

// Configuración del puerto. Render asigna el puerto en la variable PORT.
const PORT = process.env.PORT || 5000;

// Clave secreta para el token (usar .env en producción)
const SECRET_KEY = "mi_clave_secreta";

// Middleware
app.use(bodyParser.json());

// Configurar CORS con opciones específicas
const corsOptions = {
  origin: ["https://89app.netlify.app", "http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Conexión a PostgreSQL
const db = new Client({
  host: process.env.DB_HOST || "dpg-cupt41a3esus738iik5g-a.oregon-postgres.render.com",
  user: process.env.DB_USER || "registro_usuarios_4059_user",
  password: process.env.DB_PASS || "P2Yoeom9EtZMBKjPKs4eJTfnV8vWPKj8",
  database: process.env.DB_DATABASE || "registro_usuarios_4059",
  port: 5432,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect(err => {
  if (err) {
    console.error("Error conectando a la base de datos PostgreSQL:", err);
    process.exit();
  }
  console.log("Conectado a la base de datos PostgreSQL");
});

// Middleware para verificar el token de autenticación
const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) {
    console.log("❌ No se recibió token en la solicitud");
    return res.status(403).json({ message: "Token requerido" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7); // Eliminar "Bearer "
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("✅ Token decodificado correctamente:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Error al verificar token:", error.name);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado, inicie sesión nuevamente" });
    }

    return res.status(401).json({ message: "Token inválido" });
  }
};

// Ruta para registrar usuarios
app.post("/register", async (req, res) => {
  let { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }
  // Convertir la primera letra del nombre en mayúscula
  name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  try {
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ message: "El usuario ya está registrado" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para iniciar sesión
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }
  try {
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "24h",
    });
    res.status(200).json({ message: "Inicio de sesión exitoso", token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta protegida para obtener el nombre del usuario
app.post("/getUserName", verifyToken, async (req, res) => {
  console.log("🔹 Token recibido:", req.headers["authorization"]);

  if (!req.user) {
    console.log("❌ No se pudo extraer el usuario del token.");
    return res.status(401).json({ message: "Token inválido o expirado" });
  }

  console.log("✅ Usuario autenticado:", req.user.email);

  const email = req.user.email;
  try {
    const result = await db.query("SELECT name FROM users WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      console.log("✅ Nombre obtenido:", result.rows[0].name);
      res.json({ name: result.rows[0].name });
    } else {
      console.log("❌ Usuario no encontrado en la base de datos.");
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (err) {
    console.error("❌ Error en la consulta SQL:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Ruta para agregar una nueva carrera
app.post("/carreras", verifyToken, async (req, res) => {
  const { categoria, subcategoria, resolucion, cohorte, duracion, horas } = req.body;
  if (!categoria || !subcategoria || !resolucion || !cohorte || !duracion || !horas) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }
  try {
    const checkResult = await db.query(
      "SELECT * FROM carreras WHERE resolucion = $1 AND cohorte = $2",
      [resolucion, cohorte]
    );
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: "La carrera ya está cargada" });
    }
    await db.query(
      "INSERT INTO carreras (categoria, subcategoria, resolucion, cohorte, duracion, carga_horaria) VALUES ($1, $2, $3, $4, $5, $6)",
      [categoria, subcategoria, resolucion, cohorte, duracion, horas]
    );
    res.status(201).json({ message: "Carrera guardada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para buscar carreras
app.get("/carreras", verifyToken, async (req, res) => {
  const busqueda = req.query.busqueda || "";
  try {
    const sql = `
      SELECT id, subcategoria, resolucion, cohorte, duracion, carga_horaria 
      FROM carreras
      WHERE subcategoria ILIKE $1 OR resolucion ILIKE $1
    `;
    const result = await db.query(sql, [`%${busqueda}%`]);
    res.json(result.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para actualizar carreras
app.put("/carreras/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { subcategoria, resolucion, cohorte, duracion, carga_horaria } = req.body;
  if (!id) {
    return res.status(400).json({ message: "ID no definido." });
  }
  try {
    await db.query(
      "UPDATE carreras SET subcategoria = $1, resolucion = $2, cohorte = $3, duracion = $4, carga_horaria = $5 WHERE id = $6",
      [subcategoria, resolucion, cohorte, duracion, carga_horaria, id]
    );
    res.json({ message: "Carrera actualizada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para eliminar carreras
app.delete("/carreras/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "ID no definido." });
  }
  try {
    const result = await db.query("DELETE FROM carreras WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No se encontró el registro a eliminar." });
    }
    res.json({ message: "Carrera eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para obtener todas las subcategorías (carreras)
app.get("/carreras/subcategorias", async (req, res) => {
  try {
    const result = await db.query("SELECT id, subcategoria FROM carreras");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para agregar una nueva materia
app.post("/materias", verifyToken, async (req, res) => {
  try {
    let { carrera, nombre_materia, anio } = req.body;
    if (!carrera || !nombre_materia || !anio) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }
    // Función para capitalizar palabras
    const capitalizeWords = (text) => {
      const connectors = ["y", "o"];
      return text
        .toLowerCase()
        .split(" ")
        .map((word) => (connectors.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(" ");
    };
    nombre_materia = capitalizeWords(nombre_materia);
    const sql = "INSERT INTO materias (carrera, nombre_materia, anio) VALUES ($1, $2, $3)";
    await db.query(sql, [carrera, nombre_materia, anio]);
    res.status(201).json({ message: "Materia guardada correctamente" });
  } catch (error) {
    console.error("Error al guardar materia:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ruta para buscar materias (búsqueda general)
app.get("/materias", verifyToken, async (req, res) => {
  const busqueda = req.query.busqueda || "";
  try {
    const sql = `
      SELECT id, nombre_materia, carrera, anio 
      FROM materias
      WHERE nombre_materia ILIKE $1 OR carrera ILIKE $1 OR CAST(anio AS TEXT) ILIKE $1
      ORDER BY nombre_materia ASC, carrera ASC, anio ASC
    `;
    const result = await db.query(sql, [`%${busqueda}%`]);
    res.json(result.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para actualizar materias
app.put("/materias/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  let { carrera, nombre_materia, anio } = req.body;
  if (!id || !carrera || !nombre_materia) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }
  const capitalizeWords = (text) => {
    const connectors = ["y", "o"];
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => (connectors.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join(" ");
  };
  nombre_materia = capitalizeWords(nombre_materia);
  const sql = "UPDATE materias SET carrera = $1, nombre_materia = $2, anio = $3 WHERE id = $4";
  try {
    await db.query(sql, [carrera, nombre_materia, anio, id]);
    res.json({ message: "Materia actualizada correctamente" });
  } catch (err) {
    console.error("Error en el servidor:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para eliminar materias
app.delete("/materias/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "ID no definido." });
  }
  try {
    await db.query("DELETE FROM materias WHERE id = $1", [id]);
    res.json({ message: "Materia eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para obtener nombre y rol del usuario
app.post("/getUserInfo", verifyToken, async (req, res) => {
  const email = req.user.email;
  try {
    const result = await db.query("SELECT name, rol_id FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      res.json({ name: result.rows[0].name, rol_id: result.rows[0].rol_id });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para agregar un nuevo estudiante
app.post("/estudiantes", verifyToken, async (req, res) => {
  const { carrera, apellido_y_nombre, dni, fecha_de_nacimiento, telefono, email } = req.body;
  if (!carrera || !apellido_y_nombre || !dni || !fecha_de_nacimiento || !email) {
    return res.status(400).json({ message: "Todos los campos obligatorios deben completarse." });
  }
  try {
    const insertSql = `
      INSERT INTO estudiantes (carrera, apellido_y_nombre, dni, fecha_de_nacimiento, telefono, email)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [carrera, apellido_y_nombre, dni, fecha_de_nacimiento, telefono || null, email];
    await db.query(insertSql, values);
    res.status(201).json({ message: "Estudiante guardado exitosamente." });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ message: "Error: DNI duplicado en la base de datos" });
    }
    res.status(500).json({ message: "Ocurrió un error al guardar el estudiante." });
  }
});

// Ruta para buscar estudiantes y DNI duplicados
app.get("/estudiantes", verifyToken, async (req, res) => {
  const busqueda = req.query.busqueda || "";
  try {
    const sql = `
      SELECT id, apellido_y_nombre AS nombre, dni, fecha_de_nacimiento AS fecha_nacimiento, telefono, email, carrera
      FROM estudiantes
      WHERE apellido_y_nombre ILIKE $1 OR dni ILIKE $2
    `;
    const resultados = await db.query(sql, [`%${busqueda}%`, `%${busqueda}%`]);
    res.json(resultados.rows);
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    res.status(500).json({ message: "Error al obtener estudiantes" });
  }
});

// Ruta para actualizar un estudiante
app.put("/estudiantes/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { apellido_y_nombre, dni, fecha_de_nacimiento, telefono, email } = req.body;
  if (!apellido_y_nombre || !dni || !fecha_de_nacimiento || !telefono || !email) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }
  try {
    const sql = `
      UPDATE estudiantes 
      SET apellido_y_nombre = $1, dni = $2, fecha_de_nacimiento = $3, telefono = $4, email = $5
      WHERE id = $6
    `;
    const values = [apellido_y_nombre, dni, fecha_de_nacimiento, telefono, email, id];
    await db.query(sql, values);
    res.status(200).json({ message: "Estudiante actualizado correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el estudiante." });
  }
});

// Ruta para eliminar estudiantes
app.delete("/estudiantes/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "ID no definido." });
  }
  try {
    const result = await db.query("DELETE FROM estudiantes WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No se encontró el registro a eliminar." });
    }
    res.json({ message: "Estudiante eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para validar DNI en edición de estudiantes
app.get("/estudiantes/validar-dni", async (req, res) => {
  const { dni, id } = req.query;
  if (!dni || dni.length !== 8) {
    return res.status(400).json({ duplicado: false });
  }
  try {
    const numericId = Number(id) || 0;
    const sql = "SELECT COUNT(*) AS count FROM estudiantes WHERE dni = $1 AND id != $2";
    const result = await db.query(sql, [dni, numericId]);
    if (parseInt(result.rows[0].count) > 0) {
      res.json({ duplicado: true });
    } else {
      res.json({ duplicado: false });
    }
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ duplicado: false });
  }
});

// Ruta para buscar un estudiante por DNI
app.get("/estudiantes/:dni", verifyToken, async (req, res) => {
  const { dni } = req.params;
  try {
    const estudiantesSql = `
      SELECT apellido_y_nombre AS nombre, carrera, 'estudiantes' AS tabla
      FROM estudiantes
      WHERE dni = $1
    `;
    const duplicadosSql = `
      SELECT apellido_y_nombre AS nombre, carrera, 'dni_duplicados' AS tabla
      FROM dni_duplicados
      WHERE dni = $1
    `;
    const [estudiantesResult, duplicadosResult] = await Promise.all([
      db.query(estudiantesSql, [dni]),
      db.query(duplicadosSql, [dni])
    ]);
    const allResults = [...estudiantesResult.rows, ...duplicadosResult.rows];
    if (allResults.length === 0) {
      return res.status(404).json({ message: "Estudiante no encontrado en ninguna tabla" });
    }
    const resultadosConResoluciones = await Promise.all(
      allResults.map(async (registro) => {
        const resolucionSql = "SELECT resolucion FROM carreras WHERE subcategoria = $1";
        const resolucionResult = await db.query(resolucionSql, [registro.carrera]);
        const resolucion = resolucionResult.rows.length > 0 ? resolucionResult.rows[0].resolucion : "No disponible";
        return { ...registro, resolucion };
      })
    );
    res.json(resultadosConResoluciones);
  } catch (error) {
    console.error("Error al buscar estudiante:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta para filtrar materias por carrera y año (con logs)
app.get("/materias/filtrar", verifyToken, async (req, res) => {
  let { carrera, anio } = req.query;
  console.log("📩 Parámetros recibidos en el backend:");
  console.log("Carrera recibida en la API:", `"${carrera}"`);
  console.log("Año recibido en la API:", `"${anio}"`);
  if (!carrera || !anio) {
    return res.status(400).json({ error: "Faltan parámetros carrera o año" });
  }
  carrera = carrera.trim().toLowerCase();
  const sql = "SELECT id, nombre_materia, carrera, anio FROM materias WHERE LOWER(TRIM(carrera)) = $1 AND anio = $2";
  console.log("🔍 Consulta SQL ejecutada:", sql);
  console.log("🔍 Valores enviados a PG:", [carrera, anio]);
  try {
    const result = await db.query(sql, [carrera, anio]);
    console.log("✅ Materias filtradas enviadas al frontend:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en la consulta SQL:", err);
    res.status(500).json({ error: "Error en la consulta SQL" });
  }
});

// Función para convertir fecha
function convertDate(dateStr) {
  if (!dateStr) return "";
  if (dateStr.indexOf("-") !== -1) return dateStr;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Endpoint GET para consultar calificaciones por DNI y materia
app.get("/calificaciones", verifyToken, async (req, res) => {
  const { dni, materia } = req.query;
  if (!dni || !materia) {
    return res.status(400).json({ message: "Se requieren 'dni' y 'materia' para la consulta" });
  }
  try {
    const sql = "SELECT * FROM calificaciones WHERE dni = $1 AND materia = $2";
    const results = await db.query(sql, [dni, materia]);
    res.status(200).json(results.rows);
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    res.status(500).json({ message: "Error al obtener calificaciones" });
  }
});

// Endpoint PUT para actualizar una calificación existente
app.put("/calificaciones/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras } = req.body;
  if (!dni || !ap_nombre || !carrera || !materia || !curso) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }
  try {
    const sql = `
      UPDATE calificaciones 
      SET dni = $1, ap_nombre = $2, carrera = $3, resolucion = $4, materia = $5, curso = $6, l_f = $7, fecha_aprobacion = $8, numeros = $9, letras = $10
      WHERE id = $11
    `;
    const values = [dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras, id];
    const result = await db.query(sql, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No se encontró registro para actualizar" });
    }
    res.status(200).json({ message: "Registro actualizado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar calificación" });
  }
});

// Endpoint GET para generar Analítico Parcial con xlsx-populate
app.get("/generar-analitico", async (req, res) => {
  const { dni, apNombre, archivo, resolucion, carrera } = req.query;
  if (!dni || !apNombre || !archivo || !resolucion || !carrera) {
    return res
      .status(400)
      .send("Se requieren los parámetros 'dni', 'apNombre', 'archivo', 'resolucion' y 'carrera'.");
  }
  try {
    const templatePath = path.join(__dirname, "public", archivo);
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);
    const sheet = workbook.sheet(0);
    // Insertar datos generales
    sheet.cell("B7").value(apNombre);
    const dniLimpio = dni.trim();
    const dniValor = /^\d+$/.test(dniLimpio) ? Number(dniLimpio) : dniLimpio;
    sheet.cell("D7").value(dniValor);
    if (typeof dniValor === "number") {
      sheet.cell("D7").style("numberFormat", "#,##0");
    }
    sheet.cell("A9").value(carrera);
    const resolucionLimpia = resolucion.trim();
    const resolucionValor = /^\d+$/.test(resolucionLimpia) ? Number(resolucionLimpia) : resolucionLimpia;
    sheet.cell("E9").value(resolucionValor);
    sheet.cell("E9").style("numberFormat", "0");
    // Consulta en la base de datos para obtener registros
    const sql = `
      SELECT materia, l_f, fecha_aprobacion, numeros, letras 
      FROM calificaciones 
      WHERE dni = $1 AND resolucion = $2 AND carrera = $3
    `;
    const values = [dni, resolucion, carrera];
    const results = await db.query(sql, values);
    const materiasOrdenadas = [
      "Algebra",
      "Análisis Matemático I",
      "Ingles Técnico I",
      "Administración de las Organizaciones",
      "Metodología de la Investigación",
      "Programación I",
      "Introducción a los Sistemas de Información",
      "Arquitectura de Computadores",
      "Edi",
      "Practica Profesional I"
    ];
    let row = 12;
    if (results.rows && results.rows.length > 0) {
      for (const materia of materiasOrdenadas) {
        const record = results.rows.find(r => r.materia === materia);
        if (record) {
          sheet.cell(`B${row}`).value(record.materia);
          const esCursadaAprobada =
            (record.l_f && record.l_f.trim().toLowerCase() === "cursada aprobada") ||
            (record.letras && record.letras.trim().toLowerCase() === "cursada aprobada");
          const esDebeCursar =
            (record.l_f && record.l_f.trim().toLowerCase() === "debe cursar") ||
            (record.letras && record.letras.trim().toLowerCase() === "debe cursar");
          if (esCursadaAprobada) {
            const valorCursadaAprobada =
              (record.l_f && record.l_f.trim().toLowerCase() === "cursada aprobada")
                ? record.l_f
                : record.letras;
            sheet.range(`C${row}:E${row}`).merged(true);
            sheet.cell(`C${row}`).value(valorCursadaAprobada);
            sheet.cell(`F${row}`).value(record.fecha_aprobacion);
          } else if (esDebeCursar) {
            const valorDebeCursar =
              (record.l_f && record.l_f.trim().toLowerCase() === "debe cursar")
                ? record.l_f
                : record.letras;
            sheet.range(`C${row}:F${row}`).merged(true);
            sheet.cell(`C${row}`).value(valorDebeCursar);
          } else {
            sheet.cell(`C${row}`).value(record.numeros);
            sheet.cell(`D${row}`).value(record.letras);
            sheet.cell(`E${row}`).value(record.l_f);
            sheet.cell(`F${row}`).value(record.fecha_aprobacion);
          }
          row++;
          if (row > 25) break;
        }
      }
    } else {
      sheet.cell("B12").value("No se encontró materia");
      sheet.cell("C12").value("");
      sheet.cell("D12").value("");
      sheet.cell("E12").value("");
      sheet.cell("F12").value("");
    }
    // Insertar fecha generada
    const hoy = new Date();
    const day = hoy.getDate();
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const month = monthNames[hoy.getMonth()];
    const year = hoy.getFullYear();
    if (carrera.toLowerCase().includes("prof")) {
      sheet.cell("C76").value(day);
      sheet.cell("F76").value(month);
      sheet.cell("B78").value(year);
    } else {
      sheet.cell("C49").value(day);
      sheet.cell("F49").value(month);
      sheet.cell("B51").value(year);
    }
    const apNombreSafe = apNombre.replace(/\s+/g, "_");
    const carreraSafe = carrera.replace(/\s+/g, "_");
    const nombreArchivo = `Analitico Parcial_${apNombreSafe}_${year}_${carreraSafe}.xlsx`;
    const buffer = await workbook.outputAsync();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${nombreArchivo}`);
    res.send(buffer);
  } catch (error) {
    console.error("Error al generar el analítico:", error);
    res.status(500).send("Error al generar el analítico parcial");
  }
});

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static("public"));

// Fallback route: para cualquier ruta que no coincida con las API, se envía el index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint POST para insertar calificaciones
app.post("/calificaciones", verifyToken, async (req, res) => {
  try {
    const {
      dni,
      ap_nombre,
      carrera,
      resolucion,
      materia,
      curso,
      l_f,
      fecha_aprobacion,
      numeros,
      letras,
    } = req.body;
    if (!dni || !ap_nombre || !carrera || !materia || !curso) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }
    const sql = `
      INSERT INTO calificaciones 
      (dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    const values = [dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras];
    const result = await db.query(sql, values);
    res.status(201).json({ message: "Registro creado exitosamente", id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ message: "Error al insertar calificación" });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
