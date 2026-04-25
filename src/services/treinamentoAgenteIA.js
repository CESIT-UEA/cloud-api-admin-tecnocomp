const { validarTipoArquivo } = require("../utils/validarTipoArquivo");
const fs = require('fs');

async function enviarArquivoParaTreinamentoAgenteIA(nomeModulo, idModulo, file){
    try {
        const isValido = validarTipoArquivo(file, ['application/pdf']);

        if (!isValido) throw new Error('Tipo de arquivo inválido!');

        const formData = new FormData();
        const buffer = fs.readFileSync(file.path);
        const blob = new Blob([buffer], { type: file.mimetype });

        formData.append('file', blob, file.originalname);
        formData.append('nomeModulo', nomeModulo)
        formData.append('idModulo', idModulo)

        const resposta = await fetch(process.env.URL_N8N_UPLOAD_FILE, {
            method: 'POST',
            headers: { 
                'x-api-key': process.env.INTERNAL_API_KEY
            },
            body: formData,
        }).then(response => {
            return response
        });

        if (!resposta || !resposta.ok) throw new Error('Erro ao fazer requição no envio de arquivo para treinamento do agente!')

        return resposta.json()

    } catch (error) {
        console.error('Erro ao fazer envio de arquivo para treinamento do agente!', error)
        throw error
    }
}


async function excluirArquivoDeTreinamentoAgente(idModulo){
    try {
        const resposta = await fetch(
            process.env.URL_N8N_DELETE_FILE, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.INTERNAL_API_KEY
                },
                body: JSON.stringify({ idModulo })   
            }
        )

        if (!resposta.ok) throw new Error('Erro ao excluir arquivo de treinamento do Agente!')

        return resposta.json();

    } catch (error) {
        console.error('Erro ao excluir arquivo de treinamento do Agente!', error);
        throw error
    }
}


module.exports = {
    enviarArquivoParaTreinamentoAgenteIA,
    excluirArquivoDeTreinamentoAgente
}