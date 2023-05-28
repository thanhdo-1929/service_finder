
const errHandlerMiddleware = require('../../middlewares/errhandler')

describe('notFound middleware', () => {
    it('should return a 404 status code and an error message', () => {
        const req = {
            originalUrl: '/nonexistent-route'
        }
        const err = new Error(`Route ${req.originalUrl} not found!`)
        const res = {
            statusCode: 404,
            status: jest.fn().mockReturnThis()
        }
        const next = jest.fn()

        errHandlerMiddleware.notFound(req, res, next)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(next).toHaveBeenCalledWith(err)
    })
})

describe('errorHandler middleware', () => {
    it('should return correct status code and message', () => {
        const err = new Error('Test error')
        const req = {}
        const res = {
            statusCode: 200,
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        const next = jest.fn()

        errHandlerMiddleware.errorHandler(err, req, res, next)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            mes: 'Test error'
        })
    })
    it('should return that status code and message when it is not 200', () => {
        const err = new Error('Test error')
        const req = {}
        const res = {
            statusCode: 400,
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        const next = jest.fn()

        errHandlerMiddleware.errorHandler(err, req, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            mes: 'Test error'
        })
    })
})