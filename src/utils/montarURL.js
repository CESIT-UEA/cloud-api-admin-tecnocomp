function montarUrlArquivo(caminho) {
  if (!caminho) return null;

  // caso já seja URL completa (migração antiga)
  if (caminho.startsWith('https')) {
    return caminho;
  }

  return `${process.env.BASE_URL}/ebooks/${caminho}`;
}

module.exports = {
  montarUrlArquivo
};