require("dotenv").config();
const jwt = require('jsonwebtoken')
const jwtMiddleware = require('../../middlewares/jwt')

describe('gennerateAccessToken', () => {
    it('should generate a valid access token', () => {
        const uid = 'user123'
        const role = 'admin'
        const secret = process.env.JWT_SECRET;
        const token = jwtMiddleware.gennerateAccessToken(uid, role)
        const decoded = jwt.verify(token, secret)
        expect(decoded.uid).toBe(uid)
        expect(decoded.role).toBe(role)
    })

    it('should generate a refresh token', () => {
        const uid = 'user123'
        const secret = process.env.JWT_SECRET;
        const token = jwtMiddleware.gennerateRefreshToken(uid)
        const decoded = jwt.verify(token, secret)
        expect(decoded.uid).toBe(uid)
    })
})