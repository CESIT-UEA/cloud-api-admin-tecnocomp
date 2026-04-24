const { validarTipoArquivo } = require("../utils/validarTipoArquivo");
const fs = require('fs');

async function enviarArquivoParaTreinamentoAgenteIA(nomeModulo, file){
    try {
        const isValido = validarTipoArquivo(file, ['application/pdf']);

        if (!isValido) throw new Error('Tipo de arquivo inválido!');

        const formData = new FormData();
        const buffer = fs.readFileSync(file.path);
        const blob = new Blob([buffer], { type: file.mimetype });

        formData.append('file', blob, file.originalname);
        formData.append('nomeModulo', nomeModulo)

        const resposta = await fetch(process.env.URL_N8N_UPLOAD_FILE, {
            method: 'POST',
            body: formData,
        }).then(response => {
            console.log(response)
            return response
        });

        if (!resposta || !resposta.ok) throw new Error('Erro ao fazer requição no envio de arquivo para treinamento do agente!')

        return resposta.json()

    } catch (error) {
        console.error('Erro ao fazer envio de arquivo para treinamento do agente!', error)
    }
}

module.exports = {
    enviarArquivoParaTreinamentoAgenteIA
}