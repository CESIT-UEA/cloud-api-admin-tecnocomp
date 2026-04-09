const { Usuario, Modulo, UsuarioTemporario, PlataformaRegistro, Topico } = require("../models");
const bcrypt = require("bcrypt");
const { gerarCodigoEmail } = require("../utils/validarEmail");

async function getDadosUserPaginados(pagina = 1) {
  try {
    const limit = 4
    const offset = (pagina - 1) * limit
    return await Usuario.findAll({
      attributes: { exclude: ["senha", "password_reset_token", "password_reset_expires"] },
      offset,
      limit
    });
  } catch (error) {
    console.error(error);
    throw new Error("Erro ao buscar usuários");
  }
}

async function getDadosUserById(id) {
  try {
    return await Usuario.findOne({
      where: { id },
      attributes: { exclude: ["senha", "password_reset_token", "password_reset_expires"] },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Erro ao buscar usuário por ID");
  }
}


async function createUser(nome, email, senha, tipo, isUserTemporario){
    try{
      if (!senha){
        throw new Error('Senha obrigatória')
      }

      const hashedPassword = await bcrypt.hash(senha, 10);

      if (isUserTemporario){
        const codigoEmail = gerarCodigoEmail()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        await UsuarioTemporario.create(
          { username: nome, email, senha: hashedPassword, verificationCode: codigoEmail, tipo, expiresAt, lastSentAt: new Date()}
        )
        return {isUserTemporario, codigoEmail}
      }

    
      const verificaUsuarioTemporario = await UsuarioTemporario.findOne({where: {email}})
      if (verificaUsuarioTemporario){
          const usuarioTemporario = verificaUsuarioTemporario.dataValues 
          await Usuario.create({ username: nome, email, senha: usuarioTemporario.senha, tipo});
          return
      }

      await Usuario.create({ username: nome, email, senha: hashedPassword, tipo});
      return true

    }catch(error){
      console.error(error);
      throw new Error("Erro ao criar usuário");
    }
}

async function updateUser(idAdm, senhaAdm, username, email, tipo, idEditar) {
  try {
    const admin = await Usuario.findOne({ where: { id: idAdm, tipo: "adm" } });
    if (!admin || !(await bcrypt.compare(senhaAdm, admin.senha))) {
      return false;
    }

    const user = await Usuario.findOne({ where: { id: idEditar } });
    if (!user) {
      return false;
    }

    await user.update({ username, email, tipo });
    return true;
  } catch (error) {
    console.error(error);
    throw new Error("Erro ao atualizar usuário");
  }
}

async function deleteUser(idAdm, senhaAdm, idExcluir) {
  try {
    const admin = await Usuario.findOne({ where: { id: idAdm, tipo: "adm" } });
    if (!admin || !(await bcrypt.compare(senhaAdm, admin.senha))) {
      return false;
    }

    const user = await Usuario.findOne({ where: { id: idExcluir } });
    if (!user) {
      return false;
    }

    await user.destroy();
    return true;
  } catch (error) {
    console.error(error);
    throw new Error("Erro ao excluir usuário");
  }
}

async function atualizarPerfil(id, { senhaAtual, novaSenha, username, email }) {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return {
        sucesso: false,
        status: 404,
        mensagem: "Usuário não encontrado.",
      };
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) {
      return {
        sucesso: false,
        status: 401,
        mensagem: "Senha atual incorreta.",
      };
    }

    if (username) usuario.username = username;
    if (email) usuario.email = email;
    if (novaSenha) usuario.senha = await bcrypt.hash(novaSenha, 10);

    await usuario.save();

    return {
      sucesso: true,
      status: 200,
      mensagem: "Perfil atualizado com sucesso.",
    };
  } catch (error) {
    console.error("Erro ao atualizar perfil no serviço:", error);
    return {
      sucesso: false,
      status: 500,
      mensagem: "Erro ao atualizar perfil.",
    };
  }
}

async function verificaModuloEhDoUsuario(id_usuario, id_modulo) {
  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) {
    return false;
  }

  const verificaModulo = await Modulo.findOne({
    where: { usuario_id: usuario.id, id: id_modulo },
  });

  if (verificaModulo != null) {
    return true;
  } else {
    return false;
  }
}


async function verificaTopicoEhDoUsuario(idUsuario, idTopico) {
  try {

    const topico = await Topico.findOne({
      where: { id: idTopico },
      include: [
        {
          model: Modulo,
          attributes: ["usuario_id"]
        }
      ]
    });

    if (!topico || !topico.Modulo) {
      return false;
    }
    
    return topico.Modulo.usuario_id === Number(idUsuario);

  } catch (error) {
    console.error("Erro ao verificar tópico do usuário:", error);
    throw error;
  }
}

async function verificaPlataformaEhDoUsuario(id_usuario, id_plataforma) {
  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) {
    return false;
  }

  const verificaPlataforma = await PlataformaRegistro.findOne({
    where: { usuario_id: usuario.id, id: id_plataforma },
  });

  return verificaPlataforma != null;
}


async function infoPaginacaoUsuarios(){
  try {
    const limit = 4;
    const totalRegistros = await Usuario.count();
    const totalPaginas = Math.ceil(totalRegistros / limit);
    
    return { totalPaginas, totalRegistros }
  } catch (error) {
    console.error('Erro ao buscar informações dos usuários', error)
    throw new Error('Erro ao buscar informações dos usuários')
  }
}


async function createUserWithGoogle(userInfo){
    try { 
      if (!userInfo.name || !userInfo.email){ 
        return false
      }

      const username = userInfo.name;
      const email = userInfo.email;

      const usuario = await Usuario.create({
        username,
        email,
        senha: null,
        tipo: 'professor'
      })
      return usuario
    } catch (error) {
      throw new Error('Erro ao crir usuário com o Google')
    }
}

async function syncFotoDePerfil(usuario, googlePayload) {
    console.log(googlePayload.picture)
    if (!googlePayload.picture) return

    if (usuario.url_foto !== googlePayload.picture){
      usuario.url_foto = googlePayload.picture
      await usuario.save()
    }
}

module.exports = {
  getDadosUserPaginados,
  getDadosUserById,
  createUser,
  updateUser,
  deleteUser,
  atualizarPerfil,
  verificaModuloEhDoUsuario,
  infoPaginacaoUsuarios,
  createUserWithGoogle,
  syncFotoDePerfil,
  verificaPlataformaEhDoUsuario,
  verificaTopicoEhDoUsuario
};
