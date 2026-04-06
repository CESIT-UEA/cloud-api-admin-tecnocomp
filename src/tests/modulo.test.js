
require('./mocks/authMock.js')
const { validarPDF } = require('../utils/validarPDF');

jest.mock('../services/modulo', () => ({
  criarModulo: jest.fn().mockResolvedValue({
    id: 1,
    nome_modulo: 'Modulo Teste',
    video_inicial: 'video.mp4',
    nome_url: 'modulo-teste',
    usuario_id: '1'
  })
}));

jest.mock('../utils/validarPDF', () => ({
  validarPDF: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();

  validarPDF.mockReturnValue(true); 
});


const request = require('supertest');

const app = require('../app');
const path = require('path');
const fs = require('fs')

describe('POST /api/modulo', () => {
    it('Deve cadastrar módulo com sucesso', async () => {

        const response = await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE')
            .field('id', '2')
            .field('nome_modulo', 'Modulo Teste')
            .field('video_inicial', 'video.mp4')
            .field('nome_url', 'modulo-teste')
            .field('usuario_id', '1')
            .attach('file', path.resolve(__dirname, 'mocks/test.pdf'));

        expect(response.statusCode).toBe(201);
        expect(response.body.modulo).toMatchObject({
            id: expect.any(Number),
            nome_modulo: 'Modulo Teste'
        });

    });


    it('Deve retornar erro se arquivo não for PDF', async () => {
        const response = await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE')
            .attach('file', path.resolve(__dirname, 'mocks/test.txt'));
        
        expect(response.statusCode).toBe(400);
    })


    it('Deve retornar erro se não enviar arquivo', async () => {
        const response = await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE')
            .field('nome_modulo', 'Modulo Teste')
            .field('video_inicial', 'video.mp4')
            .field('nome_url', 'modulo-teste')
            .field('usuario_id', '1')
        
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe('Arquivo é obrigatório')
    })


    it('Deve retorna erro se arquivo exceder o limite de 10MB', async () => {
        const upload = require('../config/upload');

        const spy = jest.spyOn(upload, 'single').mockImplementation(() => {
            return (req, res, cb) => {
                cb({code: 'LIMIT_FILE_SIZE'})
            }
        })

        const response = await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE')

        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe('O arquivo excede o tamanho máximo permitido (10MB)')

        spy.mockRestore();
    })


    it('Deve retornar erro genérico do upload', async () => {
        const upload = require('../config/upload');

        const spy = jest.spyOn(upload, 'single').mockImplementation(() => {
            return (req, res, cb) => {
                cb({ message: 'Erro qualquer'});
            }
        })

        const response = await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE');

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Erro qualquer');

        spy.mockRestore();
    })


    it('Deve remover pasta ao ocorrer erro no upload', async () => {
        const upload = require('../config/upload');

        jest.spyOn(upload, 'single').mockImplementation(() => {
            return (req, res, cb) => {
                req.pastaId = 'pasta-teste';
                cb({ code: 'LIMIT_FILE_SIZE' });
            }
        })

        const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation(() => {});
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);

        await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE');

        expect(rmSpy).toHaveBeenCalled()
    })


    it('Deve deletar arquivo inválido', async () => {
        const { validarPDF } = require('../utils/validarPDF');

        validarPDF.mockReturnValue(false);

        const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

        await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE')
            .attach('file', path.resolve(__dirname, 'mocks/test.pdf'));

        expect(unlinkSpy).toHaveBeenCalled();
    });


    it('Deve deletar arquivo e retornar erro se o service falhar', async () => {
        const { validarPDF } = require('../utils/validarPDF');
        const moduloService = require('../services/modulo');
        const fs = require('fs');

        validarPDF.mockReturnValue(true);

        jest.spyOn(console, 'error').mockImplementation(() => {});

        moduloService.criarModulo.mockRejectedValueOnce(
            new Error('Erro no banco')
        );

        const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

        const response = await request(app)
            .post('/api/modulo')
            .set('Authorization', 'Bearer TOKEN_FAKE')
            .attach('file', path.resolve(__dirname, 'mocks/test.pdf'));

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Erro no banco');

        expect(unlinkSpy).toHaveBeenCalled(); 
    });
})