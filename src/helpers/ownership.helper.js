async function findOwnedResource(
  Model,
  id,
  user,
  ownerField = "usuario_id",
  include = [],
  attributes = undefined,
  options = {},
  extraWhere = {}
) {
  if (!user || !user.id || !user.role) {
    throw new Error("Usuário não autenticado");
  }

  if (!id) {
    throw new Error("ID não fornecido");
  }

  const where = {
    id,
    ...extraWhere
  };

  if (user.role !== "adm") {
    where[ownerField] = user.id;
  }

  const queryOptions = {
    where,
    ...(Array.isArray(include) && include.length && { include }),
    ...(attributes !== undefined && { attributes }),
    ...options
  };

  const resource = await Model.findOne(queryOptions);

  return resource;
}


async function updateOwnedResource(
  Model,
  id,
  user,
  data,
  ownerField = "usuario_id",
  options = {}
) {

  const resource = await findOwnedResource(
    Model,
    id,
    user,
    ownerField
  );

  if (!resource) return null;


  const dadosFiltrados = { ...data };
  delete dadosFiltrados.id;
  delete dadosFiltrados[ownerField];

  await resource.update(dadosFiltrados, options);

  return resource;
}

module.exports = {
  findOwnedResource,
  updateOwnedResource
};



