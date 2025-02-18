// Cargar variables de entorno desde un archivo .env (para desarrollo)
// En producción, Render usará las variables de entorno configuradas en su panel.
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const util = require("util");
const path = require("path");
const fs = require("fs");
const XlsxPopulate = require("xlsx-populate");

const app = express();

// Configuración del puerto. Render asigna el puerto en la variable PORT.
const PORT = process.env.PORT || 5000;

// Clave secreta para el token (usar .env en producción)
const SECRET_KEY = "mi_clave_secreta";

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Conexión a MySQL usando variables de entorno
const db = mysql.createConnection({
  host: process.env.DB_HOST || "dpg-cupt41a3esus738iik5g-a.oregon-postgres.render.com",          // Por ejemplo, en Render: db_host.render.com
  user: process.env.DB_USER || "registro_usuarios_4059_user",
  password: process.env.DB_PASS || "P2Yoeom9EtZMBKjPKs4eJTfnV8vWPKj8",
  database: process.env.DB_DATABASE || "registro_usuarios",
  port: 5432,
  connectTimeout: 10000  // Aumenta el tiempo de espera a 10 segundos, por ejemplo
});

// Promisify query function for async/await use
db.query = util.promisify(db.query);

// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit();
  }
  console.log("Conectado a la base de datos MySQL");
});

// Middleware para verificar el token de autenticación
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ message: "Token requerido" });
  }
  try {
    // Suponemos que el token se envía como "Bearer <token>"
    const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
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

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (results.length > 0) {
      return res.status(400).json({ message: "El usuario ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err) => {
        if (err) return res.status(500).json({ message: "Error registrando el usuario" });
        res.status(201).json({ message: "Usuario registrado con éxito" });
      }
    );
  });
});

// Ruta para iniciar sesión
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Inicio de sesión exitoso", token, name: user.name });
  });
});

// Ruta protegida para obtener el nombre del usuario
app.post("/getUserName", verifyToken, (req, res) => {
  const email = req.user.email; // Obtenemos el email del token

  db.query("SELECT name FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (results.length > 0) {
      res.json({ name: results[0].name });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  });
});

// Ruta para agregar una nueva carrera
app.post("/carreras", verifyToken, (req, res) => {
  const { categoria, subcategoria, resolucion, cohorte, duracion, horas } = req.body;

  // Validaciones
  if (!categoria || !subcategoria || !resolucion || !cohorte || !duracion || !horas) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const checkSql = "SELECT * FROM carreras WHERE resolucion = ? AND cohorte = ?";
  db.query(checkSql, [resolucion, cohorte], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: "La carrera ya está cargada" });
    }

    const insertSql =
      "INSERT INTO carreras (categoria, subcategoria, resolucion, cohorte, duracion, carga_horaria) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      insertSql,
      [categoria, subcategoria, resolucion, cohorte, duracion, horas],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Error en el servidor" });
        }
        return res.status(201).json({ message: "Carrera guardada correctamente" });
      }
    );
  });
});

// Ruta para buscar carreras
app.get("/carreras", verifyToken, (req, res) => {
  const busqueda = req.query.busqueda || "";

  const sql = `
    SELECT id, subcategoria, resolucion, cohorte, duracion, carga_horaria 
    FROM carreras
    WHERE subcategoria LIKE ? OR resolucion LIKE ?`; // Incluyendo 'id'
  db.query(sql, [`%${busqueda}%`, `%${busqueda}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    res.json(results || []);
  });
});

// Ruta para actualizar carreras
app.put("/carreras/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { subcategoria, resolucion, cohorte, duracion, carga_horaria } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID no definido." });
  }

  const sql =
    "UPDATE carreras SET subcategoria = ?, resolucion = ?, cohorte = ?, duracion = ?, carga_horaria = ? WHERE id = ?";
  db.query(sql, [subcategoria, resolucion, cohorte, duracion, carga_horaria, id], (err) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    res.json({ message: "Carrera actualizada correctamente" });
  });
});

// Ruta para eliminar carreras
app.delete("/carreras/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID no definido." });
  }

  const sql = "DELETE FROM carreras WHERE id = ?";
  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    res.json({ message: "Carrera eliminada correctamente" });
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Ruta para obtener todas las subcategorías (carreras)
app.get("/carreras", (req, res) => {
  const sql = "SELECT id, subcategoria FROM carreras";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    res.json(results); // Devuelve las subcategorías
  });
});

// Ruta para agregar una nueva materia
app.post("/materias", verifyToken, async (req, res) => {
  try {
    let { carrera, nombre_materia, anio } = req.body;

    // Validar que los campos no estén vacíos
    if (!carrera || !nombre_materia || !anio) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Función para capitalizar palabras
    const capitalizeWords = (text) => {
      const connectors = ["y", "o"];
      return text
        .toLowerCase()
        .split(" ")
        .map((word) =>
          connectors.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");
    };

    // Aplicar formato antes de guardar
    nombre_materia = capitalizeWords(nombre_materia);

    // Insertar la materia en la base de datos
    const sql = "INSERT INTO materias (carrera, nombre_materia, anio) VALUES (?, ?, ?)";
    await db.query(sql, [carrera, nombre_materia, anio]);

    res.status(201).json({ message: "Materia guardada correctamente" });
  } catch (error) {
    console.error("Error al guardar materia:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ruta para buscar materias
app.get("/materias", verifyToken, (req, res) => {
  const busqueda = req.query.busqueda || "";

  const sql = `
    SELECT id, nombre_materia, carrera, anio 
    FROM materias
    WHERE nombre_materia LIKE ? OR carrera LIKE ? OR anio LIKE ?
    ORDER BY nombre_materia ASC, carrera ASC, anio ASC`;

  db.query(sql, [`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    res.json(results || []);
  });
});

// Ruta para actualizar materias
app.put("/materias/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  let { carrera, nombre_materia, anio } = req.body;

  if (!id || !carrera || !nombre_materia) { // Eliminamos anio de la validación
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }

  // Función para capitalizar palabras
  const capitalizeWords = (text) => {
    const connectors = ["y", "o"];
    return text
      .toLowerCase()
      .split(" ")
      .map((word) =>
        connectors.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  // Aplicar formato antes de guardar
  nombre_materia = capitalizeWords(nombre_materia);

  const sql = `
    UPDATE materias 
    SET carrera = ?, nombre_materia = ?, anio = ?
    WHERE id = ?`;

  try {
    await db.query(sql, [carrera, nombre_materia, anio, id]);
    res.json({ message: "Materia actualizada correctamente" });
  } catch (err) {
    console.error("Error en el servidor:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


// Ruta para eliminar materias
app.delete("/materias/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID no definido." });
  }

  const sql = "DELETE FROM materias WHERE id = ?";
  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    res.json({ message: "Materia eliminada correctamente" });
  });
});

// Ruta duplicada para agregar una nueva materia (eliminada para evitar duplicaciones)


// Ruta para obtener nombre y rol del usuario
app.post("/getUserInfo", verifyToken, (req, res) => {
  const email = req.user.email; // Obtener el email del token

  const sql = `
    SELECT name, rol_id 
    FROM users 
    WHERE email = ?
  `;

  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }
    if (results.length > 0) {
      res.json({
        name: results[0].name,
        rol_id: results[0].rol_id, // Devolver el rol_id
      });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  });
});

// Ruta para agregar un nuevo estudiante
app.post("/estudiantes", verifyToken, async (req, res) => {
  const { carrera, apellido_y_nombre, dni, fecha_de_nacimiento, telefono, email } = req.body;

  // Validar que los campos requeridos no estén vacíos
  if (!carrera || !apellido_y_nombre || !dni || !fecha_de_nacimiento || !email) {
    return res.status(400).json({ message: "Todos los campos obligatorios deben completarse." });
  }

  try {
    // Consulta para insertar el nuevo estudiante
    const insertSql = `
      INSERT INTO estudiantes (carrera, apellido_y_nombre, dni, fecha_de_nacimiento, telefono, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [carrera, apellido_y_nombre, dni, fecha_de_nacimiento, telefono || null, email];

    await db.query(insertSql, values);
    res.status(201).json({ message: "Estudiante guardado exitosamente." });
  } catch (error) {

    // Manejar el error de entrada duplicada
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Error: DNI duplicado en la base de datos" });
    }

    // Otros errores
    res.status(500).json({ message: "Ocurrió un error al guardar el estudiante." });
  }
}); 

// Ruta para buscar estudiantes y dni duplicados
app.get("/estudiantes", verifyToken, async (req, res) => {
  const busqueda = req.query.busqueda || "";

  try {
    const sql = `
      SELECT id, apellido_y_nombre AS nombre, dni, fecha_de_nacimiento AS fecha_nacimiento, telefono, email, carrera
      FROM estudiantes
      WHERE apellido_y_nombre LIKE ? OR dni LIKE ?
    
    `;

    const resultados = await db.query(sql, [`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`]);
    res.json(resultados);
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
      SET 
        apellido_y_nombre = ?, 
        dni = ?, 
        fecha_de_nacimiento = ?, 
        telefono = ?, 
        email = ?
      WHERE id = ?
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
    const sql = "DELETE FROM estudiantes WHERE id = ?";
    const result = await db.query(sql, [id]);

    // Verificamos si alguna fila fue afectada
    if (result.affectedRows === 0) {
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
    const sql = "SELECT COUNT(*) AS count FROM estudiantes WHERE dni = ? AND id != ?";
    
    // Obtiene el resultado, que es un array de objetos
    const result = await db.query(sql, [dni, numericId]);

    // Accedemos al primer objeto del array para obtener la propiedad count
    if (result[0].count > 0) {
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
    // Consulta para buscar en la tabla `estudiantes`
    const estudiantesSql = `
      SELECT apellido_y_nombre AS nombre, carrera, 'estudiantes' AS tabla
      FROM estudiantes
      WHERE dni = ?
    `;

    // Consulta para buscar en la tabla `dni_duplicados`
    const duplicadosSql = `
      SELECT apellido_y_nombre AS nombre, carrera, 'dni_duplicados' AS tabla
      FROM dni_duplicados
      WHERE dni = ?
    `;

    // Ejecutar ambas consultas
    const [estudiantesResult, duplicadosResult] = await Promise.all([
      db.query(estudiantesSql, [dni]),
      db.query(duplicadosSql, [dni]),
    ]);

    // Combinar los resultados de ambas tablas
    const allResults = [...estudiantesResult, ...duplicadosResult];

    if (allResults.length === 0) {
      return res.status(404).json({ message: "Estudiante no encontrado en ninguna tabla" });
    }

    // Buscar las resoluciones para cada carrera
    const resultadosConResoluciones = await Promise.all(
      allResults.map(async (registro) => {
        const resolucionSql = `
          SELECT resolucion
          FROM carreras
          WHERE subcategoria = ?
        `;
        const resolucionResult = await db.query(resolucionSql, [registro.carrera]);
        const resolucion =
          resolucionResult.length > 0 ? resolucionResult[0].resolucion : "No disponible";

        return {
          ...registro,
          resolucion,
        };
      })
    );

    // Devolver todos los registros con resoluciones
    res.json(resultadosConResoluciones);
  } catch (error) {
    console.error("Error al buscar estudiante:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Agregar logs para depuración en la ruta de materias
app.get("/materias", verifyToken, (req, res) => {
  let { carrera, anio } = req.query;

  console.log("📩 Parámetros recibidos en el backend:");
  console.log("Carrera recibida en la API:", `"${carrera}"`);  // Verifica espacios
  console.log("Año recibido en la API:", `"${anio}"`);  // Verifica tipo de dato

  if (!carrera || !anio) {
    return res.status(400).json({ error: "Faltan parámetros carrera o año" });
  }

  // Normaliza la carrera en el backend
  carrera = carrera.trim().toLowerCase();

  const sql = `SELECT id, nombre_materia, carrera, anio 
               FROM materias 
               WHERE LOWER(TRIM(carrera)) = ? AND anio = ?`;

  console.log("🔍 Consulta SQL ejecutada:", sql);
  console.log("🔍 Valores enviados a MySQL:", [carrera, anio]);

  db.query(sql, [carrera, anio], (err, result) => {
    if (err) {
      console.error("❌ Error en la consulta SQL:", err);
      return res.status(500).json({ error: "Error en la consulta SQL" });
    }

    console.log("✅ Materias filtradas enviadas al frontend:", result);
    res.json(result);
  });
});

// Agrega esta función en server.js:
function convertDate(dateStr) {
  if (!dateStr) return "";
  // Si el string ya contiene "-" se asume que ya está en formato "YYYY-MM-DD"
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
    const sql = "SELECT * FROM calificaciones WHERE dni = ? AND materia = ?";
    const results = await db.query(sql, [dni, materia]);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    res.status(500).json({ message: "Error al obtener calificaciones" });
  }
});

// Endpoint PUT para actualizar una calificación existente
app.put("/calificaciones/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras } = req.body;

  // Validar que los campos requeridos no estén vacíos
  if (!dni || !ap_nombre || !carrera || !materia || !curso) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  try {
     const sql = `
      UPDATE calificaciones 
      SET dni = ?, ap_nombre = ?, carrera = ?, resolucion = ?, materia = ?, curso = ?, l_f = ?, fecha_aprobacion = ?, numeros = ?, letras = ?
      WHERE id = ?
    `;
    const values = [dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras, id];
    const result = await db.query(sql, values);
    
    // Verificamos si alguna fila fue afectada
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No se encontró registro para actualizar" });
    }

    res.status(200).json({ message: "Registro actualizado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar calificación" });
  }
});

// NUEVO ENDPOINT: Generar Analítico Parcial con xlsx-populate
// =====================================================
app.get("/generar-analitico", async (req, res) => {
  const { dni, apNombre, archivo, resolucion, carrera } = req.query;
  if (!dni || !apNombre || !archivo || !resolucion || !carrera) {
    return res
      .status(400)
      .send("Se requieren los parámetros 'dni', 'apNombre', 'archivo', 'resolucion' y 'carrera'.");
  }
  
  try {
    // Cargar la plantilla de Excel
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

    // Consulta en la base de datos para obtener los registros correspondientes
    const sql = `
      SELECT materia, l_f, fecha_aprobacion, numeros, letras 
      FROM calificaciones 
      WHERE dni = ? AND resolucion = ? AND carrera = ?
    `;
    const values = [dni, resolucion, carrera];
    const results = await db.query(sql, values);

    // Orden de materias a respetar
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

    let row = 12; // Se comienza en la fila 12

    if (results && results.length > 0) {
      // Recorrer las materias en el orden indicado
      for (const materia of materiasOrdenadas) {
        // Buscar el registro correspondiente (evitando duplicados)
        const record = results.find(r => r.materia === materia);
        if (record) {
          sheet.cell(`B${row}`).value(record.materia);

          // Determinar si es "cursada aprobada"
          const esCursadaAprobada =
            (record.l_f && record.l_f.trim().toLowerCase() === "cursada aprobada") ||
            (record.letras && record.letras.trim().toLowerCase() === "cursada aprobada");

          // Determinar si es "debe cursar"
          const esDebeCursar =
            (record.l_f && record.l_f.trim().toLowerCase() === "debe cursar") ||
            (record.letras && record.letras.trim().toLowerCase() === "debe cursar");

          if (esCursadaAprobada) {
            const valorCursadaAprobada =
              (record.l_f && record.l_f.trim().toLowerCase() === "cursada aprobada")
                ? record.l_f
                : record.letras;
            // Fusionar celdas C, D y E; se asigna la fecha en la celda F
            sheet.range(`C${row}:E${row}`).merged(true);
            sheet.cell(`C${row}`).value(valorCursadaAprobada);
            sheet.cell(`F${row}`).value(record.fecha_aprobacion);
          } else if (esDebeCursar) {
            const valorDebeCursar =
              (record.l_f && record.l_f.trim().toLowerCase() === "debe cursar")
                ? record.l_f
                : record.letras;
            // Fusionar celdas C, D, E y F
            sheet.range(`C${row}:F${row}`).merged(true);
            sheet.cell(`C${row}`).value(valorDebeCursar);
          } else {
            // Caso normal: se asignan los valores individualmente
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
      // Si no se encontró ningún registro, se coloca un mensaje en la primera celda del bloque
      sheet.cell("B12").value("No se encontró materia");
      sheet.cell("C12").value("");
      sheet.cell("D12").value("");
      sheet.cell("E12").value("");
      sheet.cell("F12").value("");
    }

    // --- Insertar fecha generada ---
    // Obtener el día, mes y año actuales
    const hoy = new Date();
    const day = hoy.getDate();
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const month = monthNames[hoy.getMonth()];
    const year = hoy.getFullYear();

    // Si la carrera es de profesorado, insertar día en C76 y mes en F76; de lo contrario, en las celdas de tecnicatura
    if (carrera.toLowerCase().includes("prof")) {
      sheet.cell("C76").value(day);
      sheet.cell("F76").value(month);
      sheet.cell("B78").value(year);
    } else {
      sheet.cell("C49").value(day);
      sheet.cell("F49").value(month);
      sheet.cell("B51").value(year);
    }
    // --- Fin inserción de fecha ---

    // Construir el nombre del archivo de salida:
    const apNombreSafe = apNombre.replace(/\s+/g, "_");
    const carreraSafe = carrera.replace(/\s+/g, "_");
    const nombreArchivo = `Analitico Parcial_${apNombreSafe}_${year}_${carreraSafe}.xlsx`;

    // Generar y enviar el archivo Excel
    const buffer = await workbook.outputAsync();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${nombreArchivo}`);
    res.send(buffer);
  } catch (error) {
    console.error("Error al generar el analítico:", error);
    res.status(500).send("Error al generar el analítico parcial");
  }
});













// =====================================================
// Servir archivos estáticos desde la carpeta "public"
// =====================================================
app.use(express.static("public"));

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

    // Validar que los campos requeridos no estén vacíos
    if (!dni || !ap_nombre || !carrera || !materia || !curso) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    const sql = `
      INSERT INTO calificaciones 
      (dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [dni, ap_nombre, carrera, resolucion, materia, curso, l_f, fecha_aprobacion, numeros, letras];

    const result = await db.query(sql, values);
    res.status(201).json({ message: "Registro creado exitosamente", id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Error al insertar calificación" });
  }
});
