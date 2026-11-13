
import { supabase } from './supabase.js';

// ESTADO DE VELTRIX
let tareas = [];
let filtroActual = "todas";
let modoRegistro = false;
let usuarioActual = null;

// ELEMENTOS DE AUTENTICACIÓN
const seccionAuth = document.getElementById("seccion-auth");
const seccionTareas = document.getElementById("seccion-tareas");
const formularioAuth = document.getElementById("formulario-auth");
const correo = document.getElementById("correo");
const contrasena = document.getElementById("contrasena");
const confirmarContrasena = document.getElementById("confirmar-contrasena");
const campoConfirmar = document.getElementById("campo-confirmar");
const tituloAuth = document.getElementById("titulo-auth");
const botonAuth = document.getElementById("boton-auth");
const cambiarAuth = document.getElementById("cambiar-auth");
const recuperarContrasena = document.getElementById("recuperar-contrasena");
const mensajeAuth = document.getElementById("mensaje-auth");
const cerrarSesion = document.getElementById("cerrar-sesion");
const usuarioCorreo = document.getElementById("usuario-correo");

// ELEMENTOS DE TAREAS
const formulario = document.getElementById("formulario-tarea");
const campoTitulo = document.getElementById("titulo");
const campoFecha = document.getElementById("fecha");
const campoHoraInicio = document.getElementById("hora-inicio");
const campoHoraFin = document.getElementById("hora-fin");
const campoTipo = document.getElementById("tipo");
const lista = document.getElementById("lista");
const contador = document.getElementById("contador");
const botonesFiltro = document.querySelectorAll(".filtro");

// CAMBIAR ENTRE REGISTRO E INICIO DE SESIÓN
cambiarAuth.addEventListener("click", function() {
    modoRegistro = !modoRegistro;

    tituloAuth.textContent = modoRegistro
        ? "Crear una cuenta"
        : "Iniciar sesión";

    botonAuth.textContent = modoRegistro
        ? "Registrarse"
        : "Iniciar sesión";

    cambiarAuth.textContent = modoRegistro
        ? "¿Ya tienes cuenta? Inicia sesión"
        : "¿No tienes cuenta? Regístrate";

    campoConfirmar.hidden = !modoRegistro;
    recuperarContrasena.hidden = modoRegistro;
    confirmarContrasena.required = modoRegistro;

    mensajeAuth.textContent = "";
    formularioAuth.reset();
});

// REGISTRO E INICIO DE SESIÓN
formularioAuth.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const email = correo.value.trim();
    const password = contrasena.value;

    mensajeAuth.textContent = "Procesando...";

    try {
        if (modoRegistro) {

            if (password !== confirmarContrasena.value) {
                mensajeAuth.textContent = "Las contraseñas no coinciden.";
                return;
            }

            if (password.length < 6) {
                mensajeAuth.textContent =
                    "La contraseña debe tener al menos 6 caracteres.";
                return;
            }

            const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
            emailRedirectTo: window.location.origin + '/index.html'
                }
            });

            if (error) throw error;

            if (data.session) {
                mensajeAuth.textContent = "¡Cuenta creada correctamente!";
            } else {
                mensajeAuth.textContent =
                    "Cuenta creada. Revisa tu correo para confirmar tu registro.";
            }

            formularioAuth.reset();

        } else {

            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            mensajeAuth.textContent = "¡Bienvenido a Veltrix!";
        }

    } catch (error) {
        mensajeAuth.textContent = "Error: " + error.message;
    }
});

// RECUPERAR CONTRASEÑA
recuperarContrasena.addEventListener("click", async function() {
    const email = correo.value.trim();

    if (!email) {
        mensajeAuth.textContent =
            "Escribe tu correo electrónico primero.";
        correo.focus();
        return;
    }

    mensajeAuth.textContent = "Enviando solicitud...";

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) throw error;

        mensajeAuth.textContent =
            "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.";

    } catch (error) {
        mensajeAuth.textContent = "Error: " + error.message;
    }
});

// MOSTRAR U OCULTAR LAS SECCIONES
function actualizarInterfaz(usuario) {
    usuarioActual = usuario;

    if (usuario) {
        seccionAuth.hidden = true;
        seccionTareas.hidden = false;
        usuarioCorreo.textContent = usuario.email;
    } else {
        seccionAuth.hidden = false;
        seccionTareas.hidden = true;
        usuarioCorreo.textContent = "";
    }
}

// CERRAR SESIÓN
cerrarSesion.addEventListener("click", async function() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert("No se pudo cerrar la sesión: " + error.message);
    }
});

// CARGAR TAREAS DESDE SUPABASE
async function cargarTareas() {
    if (!usuarioActual) return;

    const { data, error } = await supabase
        .from("tareas")
        .select("*")
        .order("fecha", { ascending: true });

    if (error) {
        alert("No se pudieron cargar las tareas: " + error.message);
        return;
    }

    tareas = data || [];
    mostrarTareas(filtroActual);
    mostrarCalendario();
}

// CONVERTIR FECHAS
function formatearFecha(fecha) {
    const partes = fecha.split("-");

    return new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    ).toLocaleDateString("es-CO");
}

// AGREGAR TAREAS
formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    if (!usuarioActual) return;

    const titulo = campoTitulo.value.trim();
    const fecha = campoFecha.value;
    const tipo = campoTipo.value;

    if (!titulo || !fecha) {
        alert("Completa el nombre y la fecha de la tarea.");
        return;
    }

    
const fechaInicio = new Date(fecha + "T12:00:00");
const fechaFin = new Date(fechaInicio);

if (tipo === "semana") {
    fechaFin.setDate(fechaFin.getDate() + 6);
} else if (tipo === "mes") {
    fechaFin.setMonth(fechaFin.getMonth() + 1);
    fechaFin.setDate(fechaFin.getDate() - 1);
}

const fechaFinSQL = obtenerFechaLocal(fechaFin);


const horaInicio = campoHoraInicio.value;
const horaFin = campoHoraFin.value;

if (!horaInicio || !horaFin) {
    alert("Selecciona la hora de inicio y finalización.");
    return;
}

if (horaFin <= horaInicio) {
    alert("La hora de finalización debe ser posterior a la de inicio.");
    return;
}

const { error } = await supabase
    .from("tareas")
    .insert({
        user_id: usuarioActual.id,
        titulo: titulo,
        fecha: fecha,
        fecha_fin: fechaFinSQL,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        tipo: tipo
    });


    if (error) {
        alert("No se pudo guardar la tarea: " + error.message);
        return;
    }

    formulario.reset();
    await cargarTareas();
    campoTitulo.focus();
});

// MOSTRAR TAREAS Y APLICAR FILTROS

function mostrarTareas(filtro) {
    filtroActual = filtro;
    lista.innerHTML = "";

    const tareasFiltradas = tareas.filter(function(tarea) {
        return filtro === "todas" || tarea.tipo === filtro;
    });

    contador.textContent = tareasFiltradas.length +
        (tareasFiltradas.length === 1 ? " tarea" : " tareas");

    if (tareasFiltradas.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "mensaje-vacio";
        mensaje.textContent =
            "No hay tareas en esta categoría todavía.";

        lista.appendChild(mensaje);
    }

    tareasFiltradas.forEach(function(tarea) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarea";

        if (tarea.completada) {
            tarjeta.classList.add("tarea-completada");
        }

        const informacion = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.textContent = tarea.titulo;

        if (tarea.completada) {
            titulo.classList.add("texto-completado");
        }

        const fecha = document.createElement("p");
        fecha.textContent = "Fecha: " + formatearFecha(tarea.fecha);

        const tipo = document.createElement("p");

        const nombresTipo = {
            dia: "Día",
            semana: "Semana",
            mes: "Mes"
        };

        tipo.textContent =
            "Organización: " + (nombresTipo[tarea.tipo] || tarea.tipo);

        const botonCompletar = document.createElement("button");
        botonCompletar.className = "completar";
        botonCompletar.type = "button";
        botonCompletar.textContent = tarea.completada
            ? "Desmarcar"
            : "Completar";

        botonCompletar.addEventListener("click", async function() {
            botonCompletar.disabled = true;

            const { error } = await supabase
                .from("tareas")
                .update({ completada: !tarea.completada })
                .eq("id", tarea.id);

            if (error) {
                alert("No se pudo actualizar la tarea: " + error.message);
                botonCompletar.disabled = false;
                return;
            }

            tarea.completada = !tarea.completada;
            mostrarTareas(filtroActual);
        });

const botonEditar = document.createElement("button");
botonEditar.className = "editar";
botonEditar.type = "button";
botonEditar.textContent = "Editar";

botonEditar.addEventListener("click", function() {
    editarTarea(tarea);
});
        const botonEliminar = document.createElement("button");
        botonEliminar.className = "eliminar";
        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", function() {
            eliminarTarea(tarea.id);
        });

        informacion.appendChild(titulo);
        informacion.appendChild(fecha);
        informacion.appendChild(tipo);

        tarjeta.appendChild(informacion);
        tarjeta.appendChild(botonEditar);
        tarjeta.appendChild(botonCompletar);
        tarjeta.appendChild(botonEliminar);

        lista.appendChild(tarjeta);
    });

    botonesFiltro.forEach(function(boton) {
        boton.classList.toggle(
            "activo",
            boton.dataset.filtro === filtro
        );
    });
}

// EDITAR TAREAS
async function editarTarea(tarea) {
    const modal = document.createElement("div");
    modal.id = "modal-editar-tarea";
    modal.className = "modal-edicion";

    const contenido = document.createElement("div");
    contenido.className = "contenido-edicion";

    const encabezado = document.createElement("h2");
    encabezado.textContent = "Editar tarea";

    const formularioEdicion = document.createElement("form");

    const labelTitulo = document.createElement("label");
    labelTitulo.textContent = "Nombre de la tarea";

    const inputTitulo = document.createElement("input");
    inputTitulo.type = "text";
    inputTitulo.value = tarea.titulo;
    inputTitulo.maxLength = 100;
    inputTitulo.required = true;

    const labelFecha = document.createElement("label");
    labelFecha.textContent = "Fecha";

    const inputFecha = document.createElement("input");
    inputFecha.type = "date";
    inputFecha.value = tarea.fecha;
    inputFecha.required = true;

const labelHoraInicio = document.createElement("label");
labelHoraInicio.textContent = "Hora de inicio";

const inputHoraInicio = document.createElement("input");
inputHoraInicio.type = "time";
inputHoraInicio.value = tarea.hora_inicio || "";
inputHoraInicio.required = true;

const labelHoraFin = document.createElement("label");
labelHoraFin.textContent = "Hora de finalización";

const inputHoraFin = document.createElement("input");
inputHoraFin.type = "time";
inputHoraFin.value = tarea.hora_fin || "";
inputHoraFin.required = true;


    const labelTipo = document.createElement("label");
    labelTipo.textContent = "Organizar por";

    const selectTipo = document.createElement("select");

    const opciones = [
        { value: "dia", text: "Día" },
        { value: "semana", text: "Semana" },
        { value: "mes", text: "Mes" }
    ];

    opciones.forEach(function(opcion) {
        const elemento = document.createElement("option");
        elemento.value = opcion.value;
        elemento.textContent = opcion.text;
        selectTipo.appendChild(elemento);
    });

    selectTipo.value = tarea.tipo;

    const botones = document.createElement("div");
    botones.className = "botones-edicion";

    const botonCancelar = document.createElement("button");
    botonCancelar.type = "button";
    botonCancelar.textContent = "Cancelar";
    botonCancelar.className = "cancelar-edicion";

    const botonGuardar = document.createElement("button");
    botonGuardar.type = "submit";
    botonGuardar.textContent = "Guardar cambios";
    botonGuardar.className = "guardar-edicion";

    botonCancelar.addEventListener("click", function() {
        modal.remove();
    });

    formularioEdicion.addEventListener("submit", async function(evento) {
        evento.preventDefault();

        botonGuardar.disabled = true;
        botonGuardar.textContent = "Guardando...";

        
const nuevaFechaInicio = new Date(inputFecha.value + "T12:00:00");
const nuevaFechaFin = new Date(nuevaFechaInicio);

if (selectTipo.value === "semana") {
    nuevaFechaFin.setDate(nuevaFechaFin.getDate() + 6);
} else if (selectTipo.value === "mes") {
    nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 1);
    nuevaFechaFin.setDate(nuevaFechaFin.getDate() - 1);
}

const nuevaFechaFinSQL = obtenerFechaLocal(nuevaFechaFin);

const { error } = await supabase
    .from("tareas")
    .update({
        titulo: inputTitulo.value.trim(),
        fecha: inputFecha.value,
        fecha_fin: nuevaFechaFinSQL,
        hora_inicio: inputHoraInicio.value,
        hora_fin: inputHoraFin.value,
        tipo: selectTipo.value
    })
    .eq("id", tarea.id);

        if (error) {
            alert("No se pudo editar la tarea: " + error.message);
            botonGuardar.disabled = false;
            botonGuardar.textContent = "Guardar cambios";
            return;
        }

        modal.remove();
        await cargarTareas();
    });

    labelTitulo.appendChild(inputTitulo);
    labelFecha.appendChild(inputFecha);
    labelHoraInicio.appendChild(inputHoraInicio);
    labelHoraFin.appendChild(inputHoraFin);
    labelTipo.appendChild(selectTipo);

    botones.appendChild(botonCancelar);
    botones.appendChild(botonGuardar);

    formularioEdicion.appendChild(labelTitulo);
    formularioEdicion.appendChild(labelFecha);
    formularioEdicion.appendChild(labelHoraInicio);
    formularioEdicion.appendChild(labelHoraFin);
    formularioEdicion.appendChild(labelTipo);
    formularioEdicion.appendChild(botones);

    contenido.appendChild(encabezado);
    contenido.appendChild(formularioEdicion);
    modal.appendChild(contenido);

    document.body.appendChild(modal);
}

// ELIMINAR TAREAS
async function eliminarTarea(id) {
    const { error } = await supabase
        .from("tareas")
        .delete()
        .eq("id", id);

    if (error) {
        alert("No se pudo eliminar la tarea: " + error.message);
        return;
    }

    await cargarTareas();
}

// BOTONES DE FILTRO
botonesFiltro.forEach(function(boton) {
    boton.addEventListener("click", function() {
        mostrarTareas(boton.dataset.filtro);
    });
});

// MANTENER LA SESIÓN Y DETECTAR CAMBIOS
supabase.auth.onAuthStateChange(function(evento, session) {
    actualizarInterfaz(session?.user || null);

    if (session?.user) {
        cargarTareas();
    } else {
        tareas = [];
        mostrarTareas("todas");
    }
});

// COMPROBAR SI YA EXISTE UNA SESIÓN
async function iniciarVeltrix() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        mensajeAuth.textContent =
            "No se pudo comprobar la sesión: " + error.message;
        return;
    }

    actualizarInterfaz(data.session?.user || null);

    if (data.session) {
        await cargarTareas();
    } else {
        mostrarTareas("todas");
    }
}

iniciarVeltrix();

// CALENDARIO VELTRIX
let fechaCalendario = new Date();
let fechaSeleccionada = obtenerFechaLocal(new Date());

function obtenerFechaLocal(fecha) {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${año}-${mes}-${dia}`;
}

function mostrarCalendario() {
    const contenedor = document.getElementById("dias-calendario");
    const tituloMes = document.getElementById("mes-actual");

    if (!contenedor || !tituloMes) return;

    contenedor.innerHTML = "";

    const año = fechaCalendario.getFullYear();
    const mes = fechaCalendario.getMonth();

    tituloMes.textContent = fechaCalendario.toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric"
    });

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);

    let desplazamiento = (primerDia.getDay() + 6) % 7;

    for (let i = 0; i < desplazamiento; i++) {
        const espacio = document.createElement("div");
        espacio.className = "dia-calendario vacio";
        contenedor.appendChild(espacio);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "dia-calendario";

        if (fecha === fechaSeleccionada) {
            boton.classList.add("seleccionado");
        }

        if (fecha === obtenerFechaLocal(new Date())) {
            boton.classList.add("hoy");
        }

        const numero = document.createElement("span");
        numero.className = "numero-dia";
        numero.textContent = dia;
        boton.appendChild(numero);

        const tieneTareas = tareas.some(tarea =>
    fecha >= tarea.fecha &&
    fecha <= (tarea.fecha_fin || tarea.fecha)
        );
        if (tieneTareas) {
            const marca = document.createElement("span");
            marca.className = "marca-tarea";
            boton.appendChild(marca);
        }

        boton.addEventListener("click", function() {
            fechaSeleccionada = fecha;
            mostrarCalendario();
            mostrarTareasFecha();
        });

        contenedor.appendChild(boton);
    }

    mostrarTareasFecha();
}

function mostrarTareasFecha() {
    const titulo = document.getElementById("fecha-seleccionada");
    const contenedor = document.getElementById("tareas-fecha");

    if (!titulo || !contenedor) return;

    const fechaBonita = new Date(fechaSeleccionada + "T12:00:00");

    titulo.textContent = fechaBonita.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    contenedor.innerHTML = "";

    const tareasDelDia = tareas.filter(tarea =>
    fechaSeleccionada >= tarea.fecha &&
    fechaSeleccionada <= (tarea.fecha_fin || tarea.fecha)
   );
    if (tareasDelDia.length === 0) {
        contenedor.textContent = "No tienes tareas para este día.";
        return;
    }

    tareasDelDia.forEach(tarea => {
        const elemento = document.createElement("div");
        elemento.className = "tarea-calendario";

        elemento.textContent =
            (tarea.completada ? "✓ " : "• ") + tarea.titulo;

        contenedor.appendChild(elemento);
    });
}

document.getElementById("mes-anterior")?.addEventListener("click", function() {
    fechaCalendario.setMonth(fechaCalendario.getMonth() - 1);
    mostrarCalendario();
});

document.getElementById("mes-siguiente")?.addEventListener("click", function() {
    fechaCalendario.setMonth(fechaCalendario.getMonth() + 1);
    mostrarCalendario();
});

// Mostrar el calendario al iniciar
mostrarCalendario();
