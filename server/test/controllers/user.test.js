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
describe('Test register', () => {
  it('register with name, email, password should return please check mail to activate account', async () => {
    const req = {
      body: {
        name: 'thanh do',
        email: 'thanhleomessi@gmail.com',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await register(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Hãy check mail để kích hoạt tài khoản',
    });
  });

  it('email is admin@gmail.com, name is thanh do, password is 123456 should return Email is registered', async () => {
    const req = {
      body: {
        name: 'thanh do',
        email: 'admin@gmail.com',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    const user = {
      email: 'admin@gmail.com',
    };
    db.User.findOne = jest.fn().mockReturnValue(user);
    await register(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Email đã được đăng ký',
    });
  });

  it('email is thanhleomessi@gmail.com, name is empty, password is 123456 should return Missing inputs', async () => {
    const req = {
      body: {
        name: '',
        email: 'thanhleomessi@gmail.com',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(register(req, res)).rejects.toThrow('Missing inputs');
  });
  it('email is admin@gmail.com, name is empty, password is 123456 should return Missing inputs', async () => {
    const req = {
      body: {
        name: '',
        email: 'admin@gmail.com',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(register(req, res)).rejects.toThrow('Missing inputs');
  });

  it('email is empty, name is thanh do, password is 123456 should return Missing inputs', async () => {
    const req = {
      body: {
        name: 'thanh do',
        email: '',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(register(req, res)).rejects.toThrow('Missing inputs');
  });

  it('email is thanhleomessi@gmail.com, name is thanh do, password is empty should return Missing inputs', async () => {
    const req = {
      body: {
        name: 'thanh do',
        email: '',
        password: '',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(register(req, res)).rejects.toThrow('Missing inputs');
  });

  it('email is empty, name is empty, password is empty should return Missing inputs', async () => {
    const req = {
      body: {
        name: '',
        email: '',
        password: '',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(register(req, res)).rejects.toThrow('Missing inputs');
  });
});

describe('finalRegister', () => {
  it('should return response redirect link confirm register', async () => {
    const req = {
      params: {
        token: '123456',
        email: 'test@test.com',
      },
    };
    const res = {
      redirect: jest.fn(),
    };
    const findOneMock = jest.fn().mockResolvedValueOnce({ id: '123456' });
    const updateMock = jest.fn().mockResolvedValueOnce([1]);
    db.User.findOne = findOneMock;
    db.User.update = updateMock;
    await finalRegister(req, res);
    expect(updateMock).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      `${process.env.CLIENT_URI}/xac-nhan-dang-ky-tai-khoan/1`
    );
  });

  it('should return response', async () => {
    const req = {
      params: {
        token: '123456',
        email: 'test@test.com',
      },
    };
    const res = {
      redirect: jest.fn(),
    };
    const findOneMock = jest.fn().mockResolvedValueOnce({ id: '123456' });
    const updateMock = jest.fn().mockResolvedValueOnce([0]);
    db.User.findOne = findOneMock;
    db.User.update = updateMock;
    await finalRegister(req, res);
    expect(updateMock).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      `${process.env.CLIENT_URI}/xac-nhan-dang-ky-tai-khoan/0`
    );
  });
});

describe('adminRole', () => {
  it('should return success true', async () => {
    const req = {
      user: {
        role: 'admin',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await adminRole(req, res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe('login', () => {
  it('should return response mail is not registered', async () => {
    const req = {
      body: {
        email: 'thanhdo@gmail.com',
        password: '123456',
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
  it('should return response mail is not registered, password incorrect', async () => {
    const req = {
      body: {
        email: 'thanhdo@gmail.com',
        password: 'test',
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
  it('should return response mail is not registered, password null', async () => {
    const req = {
      body: {
        email: 'thanhdo@gmail.com',
        password: '',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(login(req, res)).rejects.toThrow('Missing inputs');
  });
  it('email is null, password is 123456', async () => {
    const req = {
      body: {
        email: '',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(login(req, res)).rejects.toThrow('Missing inputs');
  });
  it('email is pass, password is incorrect', async () => {
    const req = {
      body: {
        email: '',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(login(req, res)).rejects.toThrow('Missing inputs');
  });
  it('email is null, password is 123456', async () => {
    const req = {
      body: {
        email: '',
        password: '123456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(login(req, res)).rejects.toThrow('Missing inputs');
  });

  it('email is pass, password is null', async () => {
    const req = {
      body: {
        email: 'thanhleomessi@gmail.com',
        password: '',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(login(req, res)).rejects.toThrow('Missing inputs');
  });
  it('email is null, password is null', async () => {
    const req = {
      body: {
        email: '',
        password: '',
      },
    };
    const res = {
      json: jest.fn(),
    };
    await expect(login(req, res)).rejects.toThrow('Missing inputs');
  });
});

describe('getUsers ', () => {
  it('should return a list of users', async () => {
    const req = {
      query: {},
    };
    const res = {
      json: jest.fn(),
    };

    const users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'johndoe@example.com',
        role: 'user',
        posts: [{ id: 1 }, { id: 2 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Anna Doe',
        email: 'anna@example.com',
        role: 'user',
        posts: [{ id: 3 }, { id: 4 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    db.User.findAndCountAll = jest.fn().mockResolvedValue(users);

    await getUsers(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      users,
    });
  });
});

describe('getCurrent', () => {
  it('should return user data', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'johndoe@example.com',
      role: 'user',
      posts: [{ id: 1 }, { id: 2 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const req = { user: { uid: user.id } };
    const res = { json: jest.fn() };
    db.User.findOne = jest.fn().mockResolvedValue(user);
    await getCurrent(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user,
    });
  });
});

describe('updateProfile', () => {
  it('should return success message when email and phone are updated', async () => {
    const req = {
      user: {
        uid: 1,
      },
      body: {
        email: 'thanhleomessi@gmail.com',
        phone: '987654321',
      },
    };
    const res = {
      json: jest.fn(),
    };
    jest.spyOn(db.User, 'update').mockResolvedValue([1]);
    await updateProfile(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: 'Cập nhật thành công',
    });
  });

  it('should return email is used on other account when email and phone are provided', async () => {
    const req = {
      user: {
        uid: 2,
      },
      body: {
        email: 'dotuanthanh@gmail.com',
        phone: '987654321',
      },
    };
    const res = {
      json: jest.fn(),
    };
    db.User.findOne = jest.fn().mockResolvedValue({ phone: '987654321' });
    jest.spyOn(db.User, 'update').mockResolvedValue([1]);
    await updateProfile(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Email đã được sử dụng ở một tài khoản khác.',
    });
  });
});

describe('getRoles', () => {
  it('should return response', async () => {
    const roles = [
      { code: 'R1', value: 'Admin' },
      { code: 'R2', value: 'Host' },
    ];
    const req = {};
    const res = {
      json: jest.fn(),
    };
    db.Role.findAll = jest.fn().mockResolvedValue(roles);
    await getRoles(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      roles,
    });
  });
});

describe('updateUserByAdmin', () => {
  it('should return Email đã được sử dụng ở một tài khoản khác.', async () => {
    const req = {
      params: {
        uid: 1,
      },
      body: {
        role: 'R1',
        email: 'thanhleomessi@gmail.com',
      },
    };
    const res = {
      json: jest.fn(),
    };
    const user = {
      id: 2,
      name: 'thanh do',
      email: 'thanhleomessi@gmail.com',
    };
    db.User.findOne = jest.fn().mockResolvedValue(user);
    await updateUserByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Email đã được sử dụng ở một tài khoản khác.',
    });
  });

  it('should return Updated when update success', async () => {
    const req = {
      params: {
        uid: 2,
      },
      body: {
        role: 'R1',
        email: 'thanhdo@gmail.com',
        name: 'thanh do',
      },
    };
    const res = {
      json: jest.fn(),
    };
    jest.spyOn(db.User, 'update').mockResolvedValue([1]);
    await updateUserByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: 'Updated',
    });
  });

  it('should return user not found with mail thanhdo@gmail.com', async () => {
    const req = {
      params: {
        uid: 2,
      },
      body: {
        role: 'R1',
        email: 'thanhdo@gmail.com',
        name: 'thanh do',
      },
    };
    const res = {
      json: jest.fn(),
    };
    db.User.update = jest.fn().mockReturnValue([0]);
    await updateUserByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Không tìm thấy người dùng',
    });
  });

  it('should return user not found with mail thanhleomessi@gmail.com', async () => {
    const req = {
      params: {
        uid: 2,
      },
      body: {
        role: 'R1',
        email: 'thanhleomessi@gmail.com',
        name: 'thanh do',
      },
    };
    const res = {
      json: jest.fn(),
    };
    db.User.update = jest.fn().mockReturnValue([0]);
    await updateUserByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      user: 'Không tìm thấy người dùng',
    });
  });
});

describe('deleteUser', () => {
  it('should delete user and related data', async () => {
    const uid = 1;
    const response = await Promise.all([
      db.User.destroy({ where: { id: uid } }),
      db.Comment.destroy({ where: { uid: uid } }),
      db.Vote.destroy({ where: { uid: uid } }),
      db.Post.destroy({ where: { postedBy: uid } }),
    ]);
    expect(response).toBeTruthy();
  });

  it('should delete user and return response success', async () => {
    const req = {
      params: {
        uid: 1,
      },
    };
    const res = {
      json: jest.fn(),
    };
    db.User.destroy = jest.fn().mockResolvedValue(1);
    await deleteUser(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Xóa user thành công',
    });
  });
});

describe('forgotPassword', () => {
  // it('should return Vui lòng check mail của bạn.', async () => {
  //   const req = {
  //     body: {
  //       email: 'test@test.com'
  //     }
  //   }
  //   const res = {
  //     status: jest.fn().mockReturnThis(),
  //     json: jest.fn()
  //   }
  //   await forgotPassword(req, res)
  //   expect(res.status).toHaveBeenCalledWith(500)
  //   expect(res.json).toHaveBeenCalledWith({
  //     err: 0,
  //     mes: 'Vui lòng check mail của bạn.'
  //   })
  // })

  it('forgotPassword should return Missing inputs', () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should return Email is not registered', async () => {
    const req = {
      body: {
        email: 'notregisteredemail@gmail.com',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const findOneSpy = jest.spyOn(db.User, 'findOne').mockResolvedValue(null);
    await forgotPassword(req, res);
    expect(findOneSpy).toHaveBeenCalledWith({
      where: { email: req.body.email },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: -1,
      mes: 'Email chưa được đăng ký!',
    });
    findOneSpy.mockRestore();
  });
  it('should return Email is not registered', async () => {
    const req = {
      body: {
        email: 'notregisteredemail@gmail.com',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const findOneSpy = jest.spyOn(db.User, 'findOne').mockResolvedValue(null);
    await forgotPassword(req, res);
    expect(findOneSpy).toHaveBeenCalledWith({
      where: { email: req.body.email },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: -1,
      mes: 'Email chưa được đăng ký!',
    });
    findOneSpy.mockRestore();
  });
});

describe('resetPassword', () => {
  it('provide password and missing token ', async () => {
    const req = {
      body: { pass: '123456' },
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
  it('password and token are missing', async () => {
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
  it('pass are missing', async () => {
    const req = {
      body: { token: '123456' },
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
  it('provide token aaaaaaaaa and password 123456 should return Something went wrong', async () => {
    const req = {
      body: {
        token: '201381asdadask212',
        password: '123456',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Something went wrong',
    });
  });

  // it('should return password reset success', async () => {
  //   const req = {
  //     body: {
  //       token: '201381asdadask212',
  //       password: '123456'
  //     }
  //   }
  //   const res = {
  //     status: jest.fn().mockReturnThis(),
  //     json: jest.fn()
  //   }
  //   const db = {
  //     User: {
  //       findOne: jest.fn().mockResolvedValue({
  //         id: 1
  //       }),
  //       update: jest.fn().mockResolvedValue([1])
  //     }
  //   }
  //   await resetPassword(req, res, null, db)
  //   expect(res.status).toHaveBeenCalledWith(200)
  //   expect(res.json).toHaveBeenCalledWith({
  //     err: 0,
  //     mes: 'Reset mật khẩu thành công.'
  //   })
  // })
});
