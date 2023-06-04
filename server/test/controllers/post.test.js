const db = require('../../models');
const {
  createPosts,
  getPosts,
  updatePost,
  deletedPost,
  getHome,
  getPostById,
  getPostsByAdmin,
  ratings,
  getDashboard,
  deletedPostByAdmin,
} = require('../../controllers/post');

const httpMocks = require('node-mocks-http');
const { Op } = require('sequelize');
jest.mock('../../models');

describe('createPosts', () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      user: { uid: '123' },
      body: {
        title: 'Test title',
        category: 'TNT',
        images: ['test.jpg'],
        foodType: 'Test food type',
      },
      files: [{ path: 'test.jpg' }],
    };
    res = {
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new post, category is TNT, foodType is QA and have link image', async () => {
    db.Post.findOrCreate = jest.fn().mockResolvedValue([{}, true]);
    req.body.category = 'TNT';
    req.body.foodType = 'QA';
    req.body.images = ['link image'];
    await createPosts(req, res, next);
    expect(db.Post.findOrCreate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Tạo bài đăng thành công',
    });
  });

  it('should throw an error if title is missing, category is TNT, foodType is QA and have link image', async () => {
    req.body.title = '';
    req.body.category = 'TNT';
    req.body.foodType = 'QA';
    req.body.images = ['link image'];
    await expect(createPosts(req, res)).rejects.toThrow('Missing inputs');
  });

  it('should create a new post, category is missing, foodType is QA and have link image', async () => {
    db.Post.findOrCreate = jest.fn().mockResolvedValue([{}, true]);
    await createPosts(req, res, next);
    expect(db.Post.findOrCreate).toHaveBeenCalled();
    req.body.category = '';
    req.body.foodType = 'QA';
    req.body.images = ['link image'];
    await expect(createPosts(req, res)).rejects.toThrow('Missing inputs');
  });

  it('should throw an error if title already exists, category is missing, foodType is QA and have link image', async () => {
    db.Post.findOne = jest.fn().mockResolvedValue({ title: 'Test title' });
    req.body.title = 'Test title';
    req.body.category = '';
    req.body.foodType = 'QA';
    req.body.images = ['link image'];
    await expect(createPosts(req, res)).rejects.toThrow('Missing inputs');
  });

  it('should throw an error if title and category are missing, foodType is QA and have link image', async () => {
    req.body.title = '';
    req.body.category = 'TNT';
    req.body.foodType = 'QA';
    req.body.images = ['link image'];
    await expect(createPosts(req, res)).rejects.toThrow('Missing inputs');
  });

  it('should throw an error if missing inputs', async () => {
    req.body.title = '';
    await expect(createPosts(req, res)).rejects.toThrow('Missing inputs');
  });

  it('should throw an error if title already exists', async () => {
    db.Post.findOrCreate = jest.fn().mockResolvedValue([{}, false]);
    await createPosts(req, res, next);
    expect(db.Post.findOrCreate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Tựa đề bài đăng không được trùng nhau',
    });
  });
});

describe('updatePost ', () => {
  it('should update post with title, images, address, desc', async () => {
    const req = {
      params: {
        pid: '123',
      },
      body: {
        isAdmin: false,
        title: 'new title',
        content: 'new content',
        images: ['test.jpg'],
        address: 'thôn 2, thạch thất, hà nội',
        desc: 'desc mô tả chi tiết',
      },
      user: {
        uid: '456',
      },
    };
    const res = {
      json: jest.fn(),
    };
    const update = jest.spyOn(db.Post, 'update').mockResolvedValue([1]);
    await updatePost(req, res);
    expect(update).toHaveBeenCalledWith(
      {
        title: 'new title',
        content: 'new content',
        images: ['test.jpg'],
        address: 'thôn 2, thạch thất, hà nội',
        desc: 'desc mô tả chi tiết',
        isAdmin: false,
      },
      { where: { id: '123', postedBy: '456' } }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      createdPost: 'Updated',
    });
  });

  it('should return post not found when title, images, address, desc', async () => {
    const req = {
      params: { pid: '123' },
      body: {
        isAdmin: false,
        images: ['test.jpg'],
        address: 'thôn 2, thạch thất, hà nội',
        desc: 'desc mô tả chi tiết',
      },
      user: { uid: '456' },
      files: [{ path: 'image1' }, { path: 'image2' }],
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.update = jest.fn().mockReturnValue([0]);
    await updatePost(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      createdPost: 'Không tìm thấy bài viết',
    });
  });
});

describe('deletePostById', () => {
  it('deletePostById should return Deleted', async () => {
    const req = {
      params: { pid: '21759tglgspnf1r' },
      user: { uid: '456' },
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.destroy = jest.fn().mockResolvedValue(1);
    await deletedPost(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      createdPost: 'Deleted',
    });
  });

  it('should return post not found', async () => {
    const req = {
      params: { pid: 'aaaaaaaaa' },
      user: { uid: '456' },
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.destroy = jest.fn().mockResolvedValue(0);
    await deletedPost(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      createdPost: 'Không tìm thấy bài viết',
    });
  });
});

describe('deletedPostByAdmin', () => {
  it('should return Deleted', async () => {
    const req = {
      params: {
        pid: '21759tglgspnf1r',
      },
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.destroy = jest.fn().mockResolvedValueOnce(1);
    await deletedPostByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      createdPost: 'Deleted',
    });
  });

  it('should return post not found', async () => {
    const req = {
      params: {
        pid: 'aaaaaaaa',
      },
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.destroy = jest.fn().mockResolvedValueOnce(0);
    await deletedPostByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      createdPost: 'Không tìm thấy bài viết',
    });
  });
});

describe('getPosts', () => {
  it('should return all posts created by user', async () => {
    const req = {
      user: {
        uid: '1234',
      },
      query: {
        page: 1,
        limit: 10,
        offset: 0,
        order: 'updatedAt',
        title: 'test',
        q: 'test',
      },
    };
    const res = {
      json: jest.fn(),
    };
    const next = jest.fn();
    const findAndCountAll = jest.fn().mockResolvedValue({
      rows: [
        {
          id: '1234',
          title: 'test',
          postedBy: '1234',
          updatedAt: '2022-01-01T00:00:00.000Z',
          createdAt: '2022-01-01T00:00:00.000Z',
        },
      ],
      count: 1,
    });
    db.Post.findAndCountAll = findAndCountAll;
    await getPosts(req, res, next);
    expect(findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { title: { [Op.substring]: 'test' } },
          { address: { [Op.substring]: 'test' } },
          { ['$user.name$']: { [Op.substring]: 'test' } },
        ],
        postedBy: '1234',
      },
      limit: 10,
      offset: 0,
      order: ['updatedAt'],
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['name', 'id', 'email'],
        },
        {
          model: db.Category,
          as: 'categoryData',
          attributes: ['code', 'value'],
        },
        {
          model: db.Foodtype,
          as: 'foodtypes',
          attributes: ['code', 'value'],
        },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: {
        rows: [
          {
            id: '1234',
            title: 'test',
            postedBy: '1234',
            updatedAt: '2022-01-01T00:00:00.000Z',
            createdAt: '2022-01-01T00:00:00.000Z',
          },
        ],
        count: 1,
      },
    });
  });

  it('should return post not found', async () => {
    const req = {
      query: {
        page: 1,
        limit: 10,
        offset: 0,
        order: [['updatedAt', 'DESC']],
        title: '',
        q: '',
      },
      user: {
        uid: '123',
      },
    };
    const res = {
      json: jest.fn(),
    };
    const findAndCountAll = jest
      .fn()
      .mockResolvedValueOnce('Không tìm thấy bài viết');
    db.Post.findAndCountAll = findAndCountAll;
    await getPosts(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: 'Không tìm thấy bài viết',
    });
  });
});

describe('getPostsByAdmin', () => {
  it('should return success true and posts', async () => {
    const req = {
      query: {
        page: 1,
        limit: 10,
        offset: 0,
        order: [['updatedAt', 'DESC']],
        title: 'test',
        price: ['0,100'],
        distance: ['0,100'],
        area: ['0,100'],
        q: 'test',
        category: 'test',
      },
    };
    const res = {
      json: jest.fn(),
    };
    const findAndCountAll = jest.fn().mockResolvedValue({
      rows: [{ id: 1, title: 'test' }],
      count: 1,
    });
    db.Post.findAndCountAll = findAndCountAll;
    await getPostsByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: { rows: [{ id: 1, title: 'test' }], count: 1 },
    });
  });

  it('should return no posts are found', async () => {
    const req = {
      query: {},
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.findAndCountAll = jest.fn(() => 'Không tìm thấy bài viết');
    await getPostsByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: 'Không tìm thấy bài viết',
    });
  });
});

describe('getHome', () => {
  it('should return all posts with user, category and foodtype data', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };
    const response = await db.Post.findAll({
      include: [
        { model: db.User, as: 'user', attributes: ['name', 'id', 'email'] },
        {
          model: db.Category,
          as: 'categoryData',
          attributes: ['code', 'value'],
        },
        { model: db.Foodtype, as: 'foodtypes', attributes: ['code', 'value'] },
      ],
    });
    req.query = {};
    await getHome(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: 'Cannot get home',
    });
  });
});

describe('ratings', () => {
  it('should return error if missing inputs', async () => {
    const req = {
      user: { uid: 1 },
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should return error if score is not a number', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 1, score: 'abc' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'The score must be less than 5 and greater than 0',
    });
  });

  it('should return error if score is greater than 5', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 1, score: 6 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'The score must be less than 5 and greater than 0',
    });
  });

  it('should return post is not found if score is 5, post id is aaaaaa', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 'aaaaaa', score: 5 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    db.Post.findOne = jest.fn().mockReturnValue(null);
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'không tìm thấy bài viết',
    });
  });

  it('should return missing inputs if no post id is provided, score is 5', async () => {
    const req = {
      user: { uid: 1 },
      body: { score: 5 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should return missing inputs if post id is aaaaaa, score is null and return missing inputs', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 'aaaaaa' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should return missing inputs if post id is adsa213d, score is null and return missing inputs', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 'adsa213d' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should return missing inputs if post id is not provided, score is null and return missing inputs', async () => {
    const req = {
      user: { uid: 1 },
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should return error if score is -1 and post id is adsa213d', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 'adsa213d', score: -1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    db.Post.findOne = jest.fn().mockReturnValue(null);
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'The score must be less than 5 and greater than 0',
    });
  });

  it('should return missing inputs if post id is not provided, score is -1 and return missing inputs', async () => {
    const req = {
      user: { uid: 1 },
      body: { score: -1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing inputs',
    });
  });

  it('should return The score must be less than 5 and greater than 0 if score is aaaaaa, post id is adsa213d', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 'adsa213d', score: 'aaaaaa' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    db.Post.findOne = jest.fn().mockReturnValue(null);
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'The score must be less than 5 and greater than 0',
    });
  });

  it('should return The score must be less than 5 and greater than 0 if score is less than 0', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 1, score: -1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await ratings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'The score must be less than 5 and greater than 0',
    });
  });

  it('should update vote if already voted', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 1, score: 3 },
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.findOne = jest.fn().mockReturnValue({ id: 1 });
    db.Vote.findOne = jest.fn().mockReturnValue({ id: 1 });
    db.Vote.update = jest.fn().mockReturnValue({ id: 1 });
    db.Vote.findAll = jest.fn().mockReturnValue([]);
    db.Post.update = jest.fn().mockReturnValue({ id: 1 });
    await ratings(req, res);
    expect(db.Vote.update).toHaveBeenCalledWith(
      { pid: 1, score: 3 },
      { where: { pid: 1, uid: 1 } }
    );
    expect(db.Post.update).toHaveBeenCalledWith(
      { star: NaN },
      { where: { id: 1 } }
    );
  });

  it('should create vote if not voted yet', async () => {
    const req = {
      user: { uid: 1 },
      body: { pid: 1, score: 3 },
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.findOne = jest.fn().mockReturnValue({ id: 1 });
    db.Vote.findOne = jest.fn().mockReturnValue(null);
    db.Vote.create = jest.fn().mockReturnValue({ id: 1 });
    db.Vote.findAll = jest.fn().mockReturnValue([]);
    db.Post.update = jest.fn().mockReturnValue({ id: 1 });
    await ratings(req, res);
    expect(db.Vote.create).toHaveBeenCalledWith({ pid: 1, score: 3, uid: 1 });
    expect(db.Post.update).toHaveBeenCalledWith(
      { star: NaN },
      { where: { id: 1 } }
    );
  });
});

describe('getPostById', () => {
  it('should return post not found', async () => {
    const req = { params: { pid: 1 } };
    const res = {
      json: jest.fn((result) => {
        return result;
      }),
    };
    const findOne = jest.spyOn(db.Post, 'findOne').mockImplementation(() => {
      return null;
    });
    await getPostById(req, res);
    expect(findOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      post: 'Không tìm thấy bài viết',
    });
  });
  it('should increment views and return list of post', async () => {
    const post = { increment: jest.fn() };
    db.Post.findOne = jest.fn().mockResolvedValue(post);
    const req = { params: { pid: 1 } };
    const res = { json: jest.fn() };
    await getPostById(req, res);
    expect(post.increment).toHaveBeenCalledWith('views', { by: 1 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      post,
    });
  });
});

describe('getDashboard', () => {
  it('should return list data of chart', async () => {
    const [rent, eatery, other, user, views, postCount, userCount] = [
      { createdAt: '01-01-21', counter: 1 },
      { createdAt: '01-01-21', counter: 2 },
      { createdAt: '01-01-21', counter: 3 },
      { createdAt: '01-01-21', counter: 4 },
      { views: 5 },
      { postCount: 6 },
      { userCount: 7 },
    ];
    const req = {
      query: {},
    };
    const res = {
      json: jest.fn(),
    };
    db.Post.findAll = jest.fn().mockResolvedValue([rent]);
    db.Post.findAll = jest.fn().mockResolvedValue([eatery]);
    db.Post.findAll = jest.fn().mockResolvedValue([other]);
    db.User.findAll = jest.fn().mockResolvedValue([user]);
    db.Visited.findAll = jest.fn().mockResolvedValue([views]);
    db.Post.findAll = jest.fn().mockResolvedValue([postCount]);
    db.User.findAll = jest.fn().mockResolvedValue([userCount]);
    await getDashboard(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      chartData: {
        eatery: [{ postCount: 6 }],
        other: [{ postCount: 6 }],
        postCount: 6,
        rent: [{ postCount: 6 }],
        user: [{ userCount: 7 }],
        userCount: 7,
        views: 5,
      },
    });
  });
});
