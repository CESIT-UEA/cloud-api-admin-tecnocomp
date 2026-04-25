async function enviarMensagemParaAgente(mensagem, nomeModulo, idModulo, sessionId) {
  try {
    const response = await fetch(process.env.URL_N8N_CONVERSA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        mensagem,
        nomeModulo,
        idModulo,
        sessionId
      })
    });

    if (!response.ok) {
      throw new Error('Erro na requisição para o agente');
    }

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(error);
    throw new Error('Erro ao fazer enviar mensagem para o Agente!');
  }
}

module.exports = {
    enviarMensagemParaAgente
}