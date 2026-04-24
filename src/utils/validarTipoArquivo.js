function validarTipoArquivo(file, tiposPermitidos){
    console.log(file, tiposPermitidos)
    return tiposPermitidos.includes(file.mimetype)
}


module.exports = {
    validarTipoArquivo
}