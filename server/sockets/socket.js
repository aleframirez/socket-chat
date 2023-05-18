const { io } = require("../server");
const { Usuarios } = require("../classes/usuarios");
const { crearMensaje } = require("../utils/utilidades");

const usuarios = new Usuarios();

io.on("connection", (client) => {
  // Coneccion de usuario
  client.on("entrarChat", (usuario, callback) => {
    if (!usuario.nombre || !usuario.sala) {
      return callback({
        error: true,
        mensaje: "El nombre/sala es necesario",
      });
    }

    client.join(usuario.sala);

    usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala);

    client.broadcast
      .to(usuario.sala)
      .emit("listaPersonas", usuarios.getPersonaPorSala(usuario.sala));

    client.broadcast
      .to(usuario.sala)
      .emit(
        "crearMensaje",
        crearMensaje(
          "Administrador",
          `${usuario.nombre} ingreso al chat`
        )
      );

    callback(usuarios.getPersonaPorSala(usuario.sala));
  });

  // Enviar mensaje
  client.on("crearMensaje", (usuario, callback) => {
    let persona = usuarios.getPersona(client.id);

    let mensaje = crearMensaje(persona.nombre, usuario.mensaje);
    client.broadcast.to(persona.sala).emit("crearMensaje", mensaje);

    callback(mensaje);
  });

  // Desconeccion de usuario
  client.on("disconnect", () => {
    let personaBorrada = usuarios.borrarPersona(client.id);

    client.broadcast
      .to(personaBorrada.sala)
      .emit(
        "crearMensaje",
        crearMensaje(
          "Administrador",
          `${personaBorrada.nombre} abandono el chat`
        )
      );
    client.broadcast
      .to(personaBorrada.sala)
      .emit("listaPersonas", usuarios.getPersonaPorSala(personaBorrada.sala));
  });

  // Mensajes privados
  client.on("mensajePrivado", (data) => {
    let persona = usuarios.getPersona(client.id);
    client.broadcast
      .to(data.para)
      .emit("mensajePrivado", crearMensaje(persona.nombre, data.mensaje));
  });
});
