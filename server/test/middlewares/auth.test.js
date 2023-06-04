
const authMiddleware = require('../../middlewares/auth')
const jsonwebtoken = require('jsonwebtoken')


describe('verifyToken middleware', () => {
  it('should call next() if token is valid', async () => {
    const req = {
      headers: {
        authorization: 'Bearer valid_token'
      }
    }
    const res = {}
    const next = jest.fn()

    // Stub the jsonwebtoken.verify function to return a decoded token
    jsonwebtoken.verify = jest.fn().mockImplementation((token, secret, callback) => {
      callback(null, { username: 'testuser' })
    })

    await authMiddleware.verifyToken(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toEqual({ username: 'testuser' })
  })

  it('should return 401 if token is invalid', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid_token'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    // Stub the jsonwebtoken.verify function to return an error
    jsonwebtoken.verify = jest.fn().mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'))
    })

    await authMiddleware.verifyToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Invalid access token'
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 if authorization header is missing', async () => {
    const req = {}
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    await authMiddleware.verifyToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Require authentication!'
    })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('check isAdmin', () => {
  it('should call next() if user is admin', () => {
    const req = {
      user: {
        role: 'R1'
      }
    }
    const res = {}
    const next = jest.fn()

    authMiddleware.isAdmin(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should throw an error if user is not admin', () => {
    const req = {
      user: {
        role: 'R2'
      }
    }
    const res = {}
    const next = jest.fn()

    expect(() => authMiddleware.isAdmin(req, res, next)).toThrow('Require Admin Role')
    expect(next).not.toHaveBeenCalled()
  })
})

describe('check isHost', () => {
  it('should call next() if user is a host', () => {
    const req = {
      user: {
        role: 'R2'
      }
    }
    const res = {}
    const next = jest.fn()

    authMiddleware.isHost(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('should throw an error if user is not a host', () => {
    const req = {
      user: {
        role: 'R3'
      }
    }
    const res = {}
    const next = jest.fn()

    expect(() => authMiddleware.isHost(req, res, next)).toThrow('Require Host Role');
    expect(next).not.toHaveBeenCalled()
  })

})
