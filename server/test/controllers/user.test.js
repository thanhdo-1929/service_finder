const db = require('../../models');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendMail = require('../../controllers/sendmail');
const { Op } = require('sequelize');
const {
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
  finalRegister,
} = require('../../controllers/user');

// Mock the dependencies if needed
jest.mock('../../models');
jest.mock('express-async-handler');
//register
describe('register', () => {
  //TC1
  test('should return success true if user is not found and email is sent', async () => {
    // Mock the request and response objects
    const req = {
      body: {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password123',
      },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock the User.findOne method
    db.User.findOne = jest.fn().mockResolvedValueOnce(null);

    // Mock the User.create method
    db.User.create = jest.fn();

    // Mock the sendMail function
    const sendMail = require('../../controllers/sendmail');
    sendMail.mockResolvedValueOnce();

    // Call the register function
    await register(req, res);

    // Assert that the response is as expected
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Hãy check mail để kích hoạt tài khoản',
    });

    // Assert that User.findOne is called with the correct arguments
    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'johndoe@example.com' },
    });

    // Assert that User.create is called with the correct arguments
    expect(db.User.create).toHaveBeenCalledWith({
      email: 'notactived',
      pass: 'password123',
      name: 'John Doe',
      id: expect.any(String),
    });

    // Assert that the sendMail function is called with the correct arguments
    expect(sendMail).toHaveBeenCalledWith({
      email: 'johndoe@example.com',
      html: expect.any(String),
      subject: 'Xác minh email đăng ký',
    });
  });
});
describe('login', () => {
  it('should return success true and a token for valid credentials', async () => {
    const req = {
      body: {
        email: 'example@example.com',
        password: 'password123',
      },
    };
    const res = {
      json: jest.fn(),
    };

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Đăng nhập thành công!',
      accessToken: expect.any(String),
    });
  });

  it('should return success false and appropriate message for invalid credentials', async () => {
    const req = {
      body: {
        email: 'example@example.com',
        password: 'wrongpassword',
      },
    };
    const res = {
      json: jest.fn(),
    };

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Sai mật khẩu!',
    });
  });

  it('should return success false for non-existing email', async () => {
    const req = {
      body: {
        email: 'nonexisting@example.com',
        password: 'password123',
      },
    };
    const res = {
      json: jest.fn(),
    };

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Email chưa được đăng ký!',
    });
  });

  it('should throw an error for missing inputs', async () => {
    const req = {
      body: {},
    };
    const res = {
      json: jest.fn(),
    };

    await expect(login(req, res)).rejects.toThrow('Missing inputs');
  });
});

describe('finalRegister', () => {
  it('should redirect to the success page when token and email match', async () => {
    const req = {
      params: {
        token: 'valid-token',
        email: 'example@example.com',
      },
    };
    const res = {
      redirect: jest.fn(),
    };

    await finalRegister(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      `${process.env.CLIENT_URI}/xac-nhan-dang-ky-tai-khoan/1`
    );
  });

  it('should redirect to the failure page when token and email do not match', async () => {
    const req = {
      params: {
        token: 'invalid-token',
        email: 'example@example.com',
      },
    };
    const res = {
      redirect: jest.fn(),
    };

    await finalRegister(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      `${process.env.CLIENT_URI}/xac-nhan-dang-ky-tai-khoan/0`
    );
  });
});

describe('adminRole', () => {
  it('should return success true', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };

    await adminRole(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
    });
  });
});

describe('getUsers', () => {
  it('should return success true and the list of users', async () => {
    const req = {
      query: {},
    };
    const res = {
      json: jest.fn(),
    };
    db.User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 2,
      rows: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ],
    });

    await getUsers(req, res);

    expect(db.User.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      limit: expect.any(Number),
      offset: expect.any(Number),
      order: undefined,
      include: expect.any(Array),
      distinct: true,
      attributes: expect.any(Object),
    });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      users: {
        count: 2,
        rows: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
      },
    });
  });
});
describe('getCurrent', () => {
  it('should get the current user', async () => {
    const req = { user: { uid: 'user-id' } };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue({
      id: 'user-id',
      name: 'User 1',
      roleData: { value: 'role-1' },
      posts: [{ id: 'post-1' }],
    });

    await getCurrent(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      attributes: { exclude: ['pass', 'rspasstk', 'rspassexp'] },
      include: [
        { model: db.Role, as: 'roleData', attributes: ['value'] },
        { model: db.Post, as: 'posts', attributes: ['id'] },
      ],
    });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: 'user-id',
        name: 'User 1',
        roleData: { value: 'role-1' },
        posts: [{ id: 'post-1' }],
      },
    });
  });

  it('should handle error when getting the current user', async () => {
    const req = { user: { uid: 'user-id' } };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

    await getCurrent(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      attributes: { exclude: ['pass', 'rspasstk', 'rspassexp'] },
      include: [
        { model: db.Role, as: 'roleData', attributes: ['value'] },
        { model: db.Post, as: 'posts', attributes: ['id'] },
      ],
    });

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Cannot get users',
    });
  });
});

describe('updateProfile', () => {
  it('should update the user profile', async () => {
    const req = {
      user: { uid: 'user-id' },
      file: { path: '/path/to/image.jpg' },
      body: { email: 'user@example.com', name: 'Updated User' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue(null);
    db.User.update = jest.fn().mockResolvedValue([1]);

    await updateProfile(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(db.User.update).toHaveBeenCalledWith(
      {
        email: 'user@example.com',
        name: 'Updated User',
        image: '/path/to/image.jpg',
      },
      { where: { id: 'user-id' } }
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: 'Cập nhật thành công',
    });
  });

  it('should handle error when updating the user profile', async () => {
    const req = {
      user: { uid: 'user-id' },
      file: { path: '/path/to/image.jpg' },
      body: { email: 'user@example.com', name: 'Updated User' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue(null);
    db.User.update = jest.fn().mockResolvedValue([0]);

    await updateProfile(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(db.User.update).toHaveBeenCalledWith(
      {
        email: 'user@example.com',
        name: 'Updated User',
        image: '/path/to/image.jpg',
      },
      { where: { id: 'user-id' } }
    );

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Có lỗi, không thể cập nhật.',
    });
  });

  it('should handle error when email is already used by another user', async () => {
    const req = {
      user: { uid: 'user-id' },
      file: { path: '/path/to/image.jpg' },
      body: { email: 'user@example.com', name: 'Updated User' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue({ id: 'other-user-id' });

    await updateProfile(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Email đã được sử dụng ở một tài khoản khác.',
    });
  });
});

describe('getRoles', () => {
  it('should get the roles', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };

    db.Role.findAll = jest
      .fn()
      .mockResolvedValue([{ value: 'role-1' }, { value: 'role-2' }]);

    await getRoles(req, res);

    expect(db.Role.findAll).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      roles: [{ value: 'role-1' }, { value: 'role-2' }],
    });
  });

  it('should handle error when getting the roles', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };

    db.Role.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

    await getRoles(req, res);

    expect(db.Role.findAll).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      roles: 'Cannot get roles',
    });
  });
});

describe('updateUserByAdmin', () => {
  it('should update a user by admin', async () => {
    const req = {
      params: { uid: 'user-id' },
      body: { email: 'user@example.com', name: 'Updated User' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue(null);
    db.User.update = jest.fn().mockResolvedValue([1]);

    await updateUserByAdmin(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(db.User.update).toHaveBeenCalledWith(
      { email: 'user@example.com', name: 'Updated User' },
      { where: { id: 'user-id' } }
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: 'Updated',
    });
  });

  it('should handle error when updating a user by admin', async () => {
    const req = {
      params: { uid: 'user-id' },
      body: { email: 'user@example.com', name: 'Updated User' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue(null);
    db.User.update = jest.fn().mockResolvedValue([0]);

    await updateUserByAdmin(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(db.User.update).toHaveBeenCalledWith(
      { email: 'user@example.com', name: 'Updated User' },
      { where: { id: 'user-id' } }
    );

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Không tìm thấy người dùng',
    });
  });

  it('should handle error when email is already used by another user', async () => {
    const req = {
      params: { uid: 'user-id' },
      body: { email: 'user@example.com', name: 'Updated User' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue({ id: 'other-user-id' });

    await updateUserByAdmin(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Email đã được sử dụng ở một tài khoản khác.',
    });
  });
});

describe('forgotPassword', () => {
  it('should send reset password email and update user', async () => {
    const req = {
      body: { email: 'user@example.com' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue({ id: 'user-id' });
    crypto.randomBytes = jest
      .fn()
      .mockReturnValueOnce(Buffer.from('random-token'));

    db.User.update = jest.fn().mockResolvedValue([1]);
    sendMail = jest.fn().mockResolvedValue();

    await forgotPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(crypto.randomBytes).toHaveBeenCalledWith(32);

    expect(db.User.update).toHaveBeenCalledWith(
      {
        rspasstk: '72616e646f6d2d746f6b656e',
        rspassexp: expect.any(Number),
      },
      { where: { email: 'user@example.com' } }
    );

    expect(sendMail).toHaveBeenCalledWith({
      email: 'user@example.com',
      html: 'Xin vui lòng click vào link dưới đây để hoàn tất reset mật khẩu.Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href=http://example.com/reset-mat-khau/72616e646f6d2d746f6b656e>Click here</a>',
      subject: 'Reset mật khẩu',
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 0,
      mes: 'Một email đã được gửi đến hộp thư của bạn.',
    });
  });

  it('should handle error when user email is not found', async () => {
    const req = {
      body: { email: 'user@example.com' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue(null);

    await forgotPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Email không tồn tại.',
    });
  });

  it('should handle error when updating the user', async () => {
    const req = {
      body: { email: 'user@example.com' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue({ id: 'user-id' });
    crypto.randomBytes = jest
      .fn()
      .mockReturnValueOnce(Buffer.from('random-token'));

    db.User.update = jest.fn().mockResolvedValue([0]);

    await forgotPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(crypto.randomBytes).toHaveBeenCalledWith(32);

    expect(db.User.update).toHaveBeenCalledWith(
      {
        rspasstk: '72616e646f6d2d746f6b656e',
        rspassexp: expect.any(Number),
      },
      { where: { email: 'user@example.com' } }
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 2,
      mes: 'Lỗi cập nhật mật khẩu tạm thời.',
    });
  });

  it('should handle error when sending the reset password email', async () => {
    const req = {
      body: { email: 'user@example.com' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue({ id: 'user-id' });
    crypto.randomBytes = jest
      .fn()
      .mockReturnValueOnce(Buffer.from('random-token'));

    db.User.update = jest.fn().mockResolvedValue([1]);
    sendMail = jest.fn().mockRejectedValue(new Error('Email error'));

    await forgotPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(crypto.randomBytes).toHaveBeenCalledWith(32);

    expect(db.User.update).toHaveBeenCalledWith(
      {
        rspasstk: '72616e646f6d2d746f6b656e',
        rspassexp: expect.any(Number),
      },
      { where: { email: 'user@example.com' } }
    );

    expect(sendMail).toHaveBeenCalledWith({
      email: 'user@example.com',
      html: 'Xin vui lòng click vào link dưới đây để hoàn tất reset mật khẩu.Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href=http://example.com/reset-mat-khau/72616e646f6d2d746f6b656e>Click here</a>',
      subject: 'Reset mật khẩu',
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 3,
      mes: 'Lỗi gửi email.',
    });
  });
});

describe('resetPassword', () => {
  it('should reset user password', async () => {
    const req = {
      body: { token: '72616e646f6d2d746f6b656e', password: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const user = {
      id: 'user-id',
      rspassexp: Math.floor(Date.now() / 1000) + 60 * 15,
    };

    db.User.findOne = jest.fn().mockResolvedValue(user);
    bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');
    db.User.update = jest.fn().mockResolvedValue([1]);

    await resetPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { rspasstk: '72616e646f6d2d746f6b656e' },
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);

    expect(db.User.update).toHaveBeenCalledWith(
      { password: 'hashed-password', rspasstk: null, rspassexp: null },
      { where: { id: 'user-id' } }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 0,
      mes: 'Đặt lại mật khẩu thành công.',
    });
  });

  it('should handle error when token is invalid', async () => {
    const req = {
      body: { token: 'invalid-token', password: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue(null);

    await resetPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { rspasstk: 'invalid-token' },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Token không hợp lệ.',
    });
  });

  it('should handle error when token is expired', async () => {
    const req = {
      body: { token: '72616e646f6d2d746f6b656e', password: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const user = {
      id: 'user-id',
      rspassexp: Math.floor(Date.now() / 1000) - 60 * 15,
    };

    db.User.findOne = jest.fn().mockResolvedValue(user);

    await resetPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { rspasstk: '72616e646f6d2d746f6b656e' },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 2,
      mes: 'Token đã hết hạn.',
    });
  });

  it('should handle error when updating the user password', async () => {
    const req = {
      body: { token: '72616e646f6d2d746f6b656e', password: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const user = {
      id: 'user-id',
      rspassexp: Math.floor(Date.now() / 1000) + 60 * 15,
    };

    db.User.findOne = jest.fn().mockResolvedValue(user);
    bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');
    db.User.update = jest.fn().mockResolvedValue([0]);

    await resetPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { rspasstk: '72616e646f6d2d746f6b656e' },
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);

    expect(db.User.update).toHaveBeenCalledWith(
      { password: 'hashed-password', rspasstk: null, rspassexp: null },
      { where: { id: 'user-id' } }
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 3,
      mes: 'Lỗi đặt lại mật khẩu.',
    });
  });
});

describe('changePassword', () => {
  it('should change user password', async () => {
    const req = {
      user: { id: 'user-id' },
      body: { oldPassword: 'old-password', newPassword: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue({
      id: 'user-id',
      password: 'hashed-password',
    });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    bcrypt.hash = jest.fn().mockResolvedValue('new-hashed-password');
    db.User.update = jest.fn().mockResolvedValue([1]);

    await changePassword(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(bcrypt.compare).toHaveBeenCalledWith(
      'old-password',
      'hashed-password'
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);

    expect(db.User.update).toHaveBeenCalledWith(
      { password: 'new-hashed-password' },
      { where: { id: 'user-id' } }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 0,
      mes: 'Thay đổi mật khẩu thành công.',
    });
  });

  it('should handle error when user is not found', async () => {
    const req = {
      user: { id: 'user-id' },
      body: { oldPassword: 'old-password', newPassword: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue(null);

    await changePassword(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Người dùng không tồn tại.',
    });
  });

  it('should handle error when old password does not match', async () => {
    const req = {
      user: { id: 'user-id' },
      body: { oldPassword: 'old-password', newPassword: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue({
      id: 'user-id',
      password: 'hashed-password',
    });
    bcrypt.compare = jest.fn().mockResolvedValue(false);

    await changePassword(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(bcrypt.compare).toHaveBeenCalledWith(
      'old-password',
      'hashed-password'
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 2,
      mes: 'Mật khẩu cũ không khớp.',
    });
  });

  it('should handle error when updating the user password', async () => {
    const req = {
      user: { id: 'user-id' },
      body: { oldPassword: 'old-password', newPassword: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue({
      id: 'user-id',
      password: 'hashed-password',
    });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    bcrypt.hash = jest.fn().mockResolvedValue('new-hashed-password');
    db.User.update = jest.fn().mockResolvedValue([0]);

    await changePassword(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(bcrypt.compare).toHaveBeenCalledWith(
      'old-password',
      'hashed-password'
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);

    expect(db.User.update).toHaveBeenCalledWith(
      { password: 'new-hashed-password' },
      { where: { id: 'user-id' } }
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 3,
      mes: 'Lỗi thay đổi mật khẩu.',
    });
  });
});

describe('getUserProfile', () => {
  it('should get user profile', async () => {
    const req = {
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue({
      id: 'user-id',
      username: 'user123',
      email: 'user@example.com',
    });

    await getUserProfile(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 0,
      mes: 'Lấy thông tin thành công.',
      user: {
        id: 'user-id',
        username: 'user123',
        email: 'user@example.com',
      },
    });
  });

  it('should handle error when user is not found', async () => {
    const req = {
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue(null);

    await getUserProfile(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Người dùng không tồn tại.',
    });
  });
});

describe('updateUserProfile', () => {
  it('should update user profile', async () => {
    const req = {
      user: { id: 'user-id' },
      body: { username: 'new-user123', email: 'new-user@example.com' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue({
      id: 'user-id',
      username: 'user123',
      email: 'user@example.com',
      save: jest.fn().mockResolvedValue(),
    });

    await updateUserProfile(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 0,
      mes: 'Cập nhật thông tin thành công.',
    });

    expect(db.User.findByPk().save).toHaveBeenCalled();
  });

  it('should handle error when user is not found', async () => {
    const req = {
      user: { id: 'user-id' },
      body: { username: 'new-user123', email: 'new-user@example.com' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue(null);

    await updateUserProfile(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Người dùng không tồn tại.',
    });
  });

  it('should handle error when failed to save user profile', async () => {
    const req = {
      user: { id: 'user-id' },
      body: { username: 'new-user123', email: 'new-user@example.com' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findByPk = jest.fn().mockResolvedValue({
      id: 'user-id',
      username: 'user123',
      email: 'user@example.com',
      save: jest.fn().mockRejectedValue(),
    });

    await updateUserProfile(req, res);

    expect(db.User.findByPk).toHaveBeenCalledWith('user-id');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 2,
      mes: 'Lỗi cập nhật thông tin.',
    });
  });
});
describe('deleteUser', () => {
  it('should delete user and related data successfully', async () => {
    const req = {
      params: { uid: 'user-id' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.destroy = jest.fn().mockResolvedValue(true);
    db.Comment.destroy = jest.fn().mockResolvedValue(true);
    db.Vote.destroy = jest.fn().mockResolvedValue(true);
    db.Post.destroy = jest.fn().mockResolvedValue(true);

    await deleteUser(req, res);

    expect(db.User.destroy).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    expect(db.Comment.destroy).toHaveBeenCalledWith({
      where: { uid: 'user-id' },
    });
    expect(db.Vote.destroy).toHaveBeenCalledWith({ where: { uid: 'user-id' } });
    expect(db.Post.destroy).toHaveBeenCalledWith({
      where: { postedBy: 'user-id' },
    });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Xóa user thành công',
    });
  });

  it('should handle error when user is not found', async () => {
    const req = {
      params: { uid: 'user-id' },
    };
    const res = {
      json: jest.fn(),
    };

    db.User.destroy = jest.fn().mockResolvedValue(false);

    // await deleteUser(req, res);

    expect(db.User.destroy).toHaveBeenCalledWith({ where: { id: 'user-id' } });

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Không tìm thấy người dùng',
    });
  });
});

describe('resetPassword', () => {
  it('should reset password successfully', async () => {
    const req = {
      body: { token: 'reset-token', password: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue({
      id: 'user-id',
    });
    db.User.update = jest.fn().mockResolvedValue([1]);

    await resetPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { rspasstk: 'reset-token' },
    });
    expect(db.User.update).toHaveBeenCalledWith(
      {
        pass: 'new-password',
        rspasstk: '',
        rspassexp: expect.any(Number),
      },
      { where: { id: 'user-id' } }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 0,
      mes: 'Reset mật khẩu thành công.',
    });
  });

  it('should handle error when token or password is missing', async () => {
    const req = {
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should handle error when token is not found', async () => {
    const req = {
      body: { token: 'reset-token', password: 'new-password' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.User.findOne = jest.fn().mockResolvedValue(null);

    await resetPassword(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { rspasstk: 'reset-token' },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Something went wrong',
    });
  });
});
