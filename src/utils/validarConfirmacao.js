const { removerAcentoTexto } = require("./removerAcento");

function validarConfirmacao(input, valorReal) {
    const inputNormalizado = removerAcentoTexto(input?.trim().toLowerCase());
    const valorNormalizado = removerAcentoTexto(valorReal?.trim().toLowerCase());

    return inputNormalizado === valorNormalizado;
}

module.exports = { validarConfirmacao }