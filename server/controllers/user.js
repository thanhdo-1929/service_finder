const db = require('../models')
const asyncHandler = require('express-async-handler')
const makeId = require('uniqid')
const { gennerateAccessToken } = require('../middlewares/jwt')
const bcrypt = require('bcryptjs')
const sequelize = require('sequelize')
const crypto = require('crypto')
const sendMail = require('./sendmail')
const { Op } = require('sequelize')

// const register = asyncHandler(async (req, res) => {
//     const { name, email, password } = req.body
//     if (!name || !email || !password) throw new Error('Missing inputs')
//     const response = await db.User.findOrCreate({
//         where: { email },
//         defaults: {
//             name,
//             pass: password,
//             id: makeId(),
//             email
//         }
//     })
//     const token = response[1] && gennerateAccessToken(response[0].id, response[0].role)
//     const rs = {
//         success: token ? true : false,
//         mes: token ? 'Đăng ký thành công!' : 'Email đã được sử dụng!',
//     }
//     if (token) rs.accessToken = token
//     return res.json(rs)
// })
const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body
    if (!name || !email || !password) throw new Error('Missing inputs')
    const user = await db.User.findOne({ where: { email } })
    const token = makeId()
    if (!user) {
        await db.User.create({
            email: 'notactived',
            pass: password,
            name: name,
            id: token
        })
    }
    if (!user) {
        const subject = 'Xác minh email đăng ký'
        const html = `Xin vui lòng click vào link dưới đây để hoàn tất đăng ký tài khoản của bạn.Link này sẽ hết hạn sau 5 phút kể từ bây giờ. <a href=${process.env.SERVER_URL}/api/user/finalregister/${req.body.email}/${token}>Click here</a>`
        await sendMail({ email: req.body.email, html, subject })
        setTimeout(async () => {
            await db.User.destroy({ where: { id: token } })
        }, [30000])
    }
    return res.json({
        success: !user ? true : false,
        mes: user ? 'Email đã được đăng ký' : 'Hãy check mail để kích hoạt tài khoản',
    })
})
const finalRegister = asyncHandler(async (req, res) => {
    const { token, email } = req.params
    const response = await db.User.findOne({ where: { id: token }, raw: true })
    if (response) {
        const update = await db.User.update({ email, id: makeId() }, { where: { id: token } })
        if (update[0] > 0)
            res.redirect(`${process.env.CLIENT_URI}/xac-nhan-dang-ky-tai-khoan/1`)
        else {
            await db.User.destroy({ where: { id: token } })
            res.redirect(`${process.env.CLIENT_URI}/xac-nhan-dang-ky-tai-khoan/0`)
        }
    } else {
        await db.User.destroy({ where: { id: token } })
        res.redirect(`${process.env.CLIENT_URI}/xac-nhan-dang-ky-tai-khoan/0`)
    }
})
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) throw new Error('Missing inputs')
    const response = await db.User.findOne({
        where: { email }
    })
    const isCorrectPassword = response && bcrypt.compareSync(password, response.pass)
    const token = isCorrectPassword && gennerateAccessToken(response.id, response.role)
    const rs = {
        success: token ? true : false,
        mes: token ? 'Đăng nhập thành công!' : response ? 'Sai mật khẩu!' : 'Email chưa được đăng ký!',
    }
    if (token) rs.accessToken = token
    return res.json(rs)
})
const adminRole = asyncHandler((req, res) => {
    return res.json({ success: true })
})
const getUsers = asyncHandler(async (req, res) => {
    let { page, limit, offset, order, name, q, ...query } = req.query
    const queries = {}
    const step = !page ? 0 : (+page - 1)
    queries.limit = +limit || +process.env.POST_LIMIT
    queries.offset = step * queries.limit
    if (name) query.name = { [Op.substring]: name }
    if (order) queries.order = [order]
    if (q) {
        query = {
            [Op.or]: [
                { name: { [Op.substring]: q.trim() } },
                { email: { [Op.substring]: q.trim() } },
            ]
        }
    }

    const response = await db.User.findAndCountAll({
        where: query,
        ...queries,
        include: [
            { model: db.Role, as: 'roleData', attributes: ['value', 'code'] },
            { model: db.Post, as: 'posts', attributes: ['id'] },
        ],
        distinct: true,
        attributes: {
            exclude: ['pass', 'rspasstk', 'rspassexp'],
        }
    })
    return res.json({
        success: response ? true : false,
        users: response ? response : 'Cannot get users'
    })
})
const getCurrent = asyncHandler(async (req, res) => {
    const { uid } = req.user
    const response = await db.User.findOne({
        where: { id: uid },
        attributes: { exclude: ['pass', 'rspasstk', 'rspassexp'] },
        include: [
            { model: db.Role, as: 'roleData', attributes: ['value'] },
            { model: db.Post, as: 'posts', attributes: ['id'] },

        ],
    })
    return res.json({
        success: response ? true : false,
        user: response ? response : 'Cannot get users'
    })
})
const updateProfile = asyncHandler(async (req, res) => {
    const { uid } = req.user
    if (req.file) req.body.image = req.file.path
    if (req.body.email) {
        const user = await db.User.findOne({ where: { email: req.body.email } })
        if (user && user.id !== uid) {
            return res.json({
                success: false,
                user: 'Email đã được sử dụng ở một tài khoản khác.'
            })
        }
    }
    const response = await db.User.update(req.body, { where: { id: uid } })
    return res.json({
        success: response[0] > 0 ? true : false,
        user: response[0] > 0 ? 'Cập nhật thành công' : 'Có lỗi, không thể cập nhật.'
    })
})
const getRoles = asyncHandler(async (req, res) => {
    const response = await db.Role.findAll()
    return res.json({
        success: response ? true : false,
        roles: response ? response : 'Cannot get roles'
    })
})
const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { uid } = req.params
    if (req.body.email) {
        const user = await db.User.findOne({ where: { email: req.body.email } })
        if (user && user.id !== uid) {
            return res.json({
                success: false,
                user: 'Email đã được sử dụng ở một tài khoản khác.'
            })
        }
    }
    const response = await db.User.update(req.body, { where: { id: uid } })
    return res.json({
        success: response[0] > 0 ? true : false,
        user: response[0] > 0 ? 'Updated' : 'Không tìm thấy người dùng'
    })
})

const deleteUser = asyncHandler(async (req, res) => {
    const { uid } = req.params
    const response = await Promise.all([
        db.User.destroy({ where: { id: uid } }),
        db.Comment.destroy({ where: { uid: uid } }),
        db.Vote.destroy({ where: { uid: uid } }),
        db.Post.destroy({ where: { postedBy: uid } }),
    ])
    return res.json({
        success: response ? true : false,
        mes: response ? 'Xóa user thành công' : 'Không tìm thấy người dùng'
    })
})
const forgotPassword = async (req, res) => {
    try {
        if (!req.body || !req.body.email) return res.status(200).json({
            err: 1,
            mes: "Missing inputs"
        })
        const rs = await db.User.findOne({ where: { email: req.body.email } })
        if (rs) {
            const token = crypto.randomBytes(32).toString('hex')
            const subject = 'Reset mật khẩu'
            const html = `Xin vui lòng click vào link dưới đây để hoàn tất reset mật khẩu.Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href=${process.env.CLIENT_URI}/reset-mat-khau/${token}>Click here</a>`
            const updated = await db.User.update({
                rspasstk: token,
                rspassexp: Date.now() + 15 * 60 * 1000
            }, {
                where: { email: req.body.email }
            })
            await sendMail({ email: req.body.email, html, subject })
            return res.status(200).json({
                err: updated[0] > 0 ? 0 : 1,
                mes: updated[0] ? 'Vui lòng check mail của bạn.' : 'Something went wrong!'
            })
        } else {
            return res.status(500).json({
                err: -1,
                mes: 'Email chưa được đăng ký!'
            })
        }
    } catch (error) {
        return res.status(500).json({
            err: -1,
            mes: 'Lỗi server ' + error
        })
    }
}
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body
        if (!token || !password) return res.status(200).json({
            err: 1,
            mes: "Missing inputs"
        })
        const rs = await db.User.findOne({ where: { rspasstk: token } })
        if (rs) {
            const updated = await db.User.update(
                {
                    pass: password,
                    rspasstk: '',
                    rspassexp: Date.now()
                },
                { where: { id: rs.id } }
            )
            return res.status(200).json({
                err: updated[0] > 0 ? 0 : 1,
                mes: updated[0] > 0 ? 'Reset mật khẩu thành công.' : 'Something went wrong'
            })
        } else {
            return res.status(200).json({
                err: 1,
                mes: 'Something went wrong'
            })
        }
    } catch (error) {
        return res.status(500).json({
            err: -1,
            mes: 'Lỗi server ' + error
        })
    }
}
module.exports = {
    register,
    login,
    adminRole,
    getUsers,
    getCurrent,
    updateProfile,
    getRoles,
    updateUserByAdmin,
    forgotPassword,
    deleteUser,
    resetPassword,
    finalRegister
}