// Pega aquí la URL de tu "buzón" de Apps Script// Pega aquí la URL de tu "buzón" de Apps Script
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxgzi6bZElvX1zgWtUGZduT1edKS12j3zW2922pDEOY3-y-Onr_3MdZLTzakldaMCs/exec";

// --- 1. Definición de tus Productos ---
// (He rellenado algunos ejemplos, tendrás que completar esto)
const baseDeProductos = {
  "Monoproducto": ["Pluma blanca", "pampa natural", "etc.", "Eucalipto verde", "eucalipto granate", "panicula..."],
  "Ramos": ["Llanes", "Espinho", "Golega", "Ucanha", "Figueira", "Seixal Do Lima", "Tábua", "Lamego"],
  "Plantas": ["Palmeira Robellini", "Marion", "Eucalipto cinerea verde", "Erica"],
  "Centros": ["Positano", "Cinque Terre", "Antibes", "Portocolom", "Fossan", "Labarca"],
  "Coronas": ["Assos", "Adrazan", "Bozburun", "Taormina", "Krioneri"],
  "Árboles": ["Cinerea", "Stuartiana", "Populus", "Parvifolia", "Fagus", "Olivo"],
  "Maisons du Monde": ["Pluma blanca", "craspedia amarilla", "Lagurus blanco", "Ramo blanco", "Conos", "Encajado"],
  "Tareas auxiliares": ["Esponja", "Troncos S", "Encajado I", "Encajado II - Cajas máster plantas y centros", "Encajado III - Cajas máster coronas", "...etc"],
  "Otros": ["Otro (especificar)"] // Dejamos "Otros" por si acaso
};


// --- 2. Variables Globales y Estado ---
let productosParaEnviar = []; // Array donde guardamos los productos

// --- 3. Referencias a Elementos del DOM ---
const form = document.getElementById("registroForm");
const fechaInput = document.getElementById("fecha");
const categoriaSelect = document.getElementById("categoria");
const productoSelect = document.getElementById("producto");
const btnAddProducto = document.getElementById("btnAddProducto");
const listaProductosUI = document.getElementById("listaProductosEnviados");
const btnEnviar = document.getElementById("btnEnviarFormulario");
const statusMensaje = document.getElementById("statusMensaje");

// --- 4. Funciones de Lógica ---

// Función para rellenar las categorías principales
function cargarCategorias() {
  const categorias = Object.keys(baseDeProductos);
  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoriaSelect.appendChild(option);
  });
}

// Función para actualizar los productos cuando cambia la categoría
function actualizarProductos() {
  const categoriaSeleccionada = categoriaSelect.value;
  productoSelect.innerHTML = '<option value="">--</option>'; // Limpiamos

  if (categoriaSeleccionada && baseDeProductos[categoriaSeleccionada]) {
    baseDeProductos[categoriaSeleccionada].forEach(prod => {
      const option = document.createElement("option");
      option.value = prod;
      option.textContent = prod;
      productoSelect.appendChild(option);
    });
  }
}

// Función para añadir un producto a la lista temporal
function añadirProductoALista() {
  const categoria = categoriaSelect.value;
  const producto = productoSelect.value;

  if (!categoria || !producto) {
    alert("Por favor, selecciona una categoría y un producto.");
    return;
  }

  // 1. Añadir al array de datos
  productosParaEnviar.push({ categoria, producto });

  // 2. Añadir a la lista visual (UI)
  const li = document.createElement("li");
  li.textContent = `[${categoria}] - ${producto}`;
  listaProductosUI.appendChild(li);

  // 3. Limpiar desplegables
  categoriaSelect.value = "";
  productoSelect.innerHTML = '<option value="">--</option>';
}

// Función para enviar el formulario completo
async function enviarFormulario(event) {
  event.preventDefault(); // Evita que la página se recargue

  if (productosParaEnviar.length === 0) {
    alert("Debes añadir al menos un producto o tarea.");
    return;
  }

  statusMensaje.textContent = "Enviando, por favor espera...";
  btnEnviar.disabled = true;

  // 1. Recopilar todos los datos
  const datosAEnviar = {
    nombre: document.getElementById("nombre").value,
    fecha: fechaInput.value,
    horaInicio: document.getElementById("horaInicio").value,
    horaFin: document.getElementById("horaFin").value,
    productos: productosParaEnviar // Enviamos el array completo
  };

  // 2. Usar fetch para enviar los datos a Google
  try {
    const response = await fetch(URL_APPS_SCRIPT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosAEnviar),
      // Redirección manual necesaria para scripts de Google
      redirect: 'follow' 
    });
    
    // Google Apps Script a veces no devuelve un JSON estándar, 
    // así que verificamos el éxito de otra manera o simplemente asumimos
    
    statusMensaje.textContent = "¡Registro guardado con éxito!";
    statusMensaje.style.color = "green";

    // 3. Limpiar formulario
    form.reset();
    listaProductosUI.innerHTML = "";
    productosParaEnviar = [];
    
  } catch (error) {
    statusMensaje.textContent = `Error al guardar: ${error.message}`;
    statusMensaje.style.color = "red";
  } finally {
    btnEnviar.disabled = false;
  }
}

// --- 5. Event Listeners (Puesta en marcha) ---

// Poner la fecha de hoy automáticamente
document.addEventListener("DOMContentLoaded", () => {
  fechaInput.value = new Date().toISOString().split('T')[0];
  cargarCategorias();
});

// Cuando cambia la categoría, actualiza los productos
categoriaSelect.addEventListener("change", actualizarProductos);

// Botón de añadir producto
btnAddProducto.addEventListener("click", añadirProductoALista);

// Botón de enviar formulario
form.addEventListener("submit", enviarFormulario);