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

jest.mock('../../models');

describe('createPosts', () => {
  // Mock dependencies or setup necessary test data

  // Test case 1: Missing inputs
  test('should throw an error when inputs are missing', async () => {
    const req = {
      user: { uid: 'user_id' },
      body: {},
    };
    const res = {
      json: jest.fn(),
    };

    await expect(createPosts(req, res)).rejects.toThrow('Missing inputs');
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Missing inputs',
    });
  });

  // Test case 2: Successful post creation
  test('should create a post successfully', async () => {
    const req = {
      user: { uid: 'user_id' },
      body: {
        title: 'Post Title',
        category: 'Category',
        images: ['/path/to/image1.jpg', '/path/to/image2.jpg'],
        foodType: 'Food Type',
      },
      files: [{ path: '/path/to/image1.jpg' }, { path: '/path/to/image2.jpg' }],
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findOrCreate function
    const dbMock = {
      Post: {
        findOrCreate: jest.fn().mockResolvedValue([{}, true]),
      },
    };

    // Mock makeid function
    const makeidMock = jest.fn().mockReturnValue('generated_id');

    // Call the createPosts function
    await createPosts(req, res, dbMock, makeidMock);

    expect(dbMock.Post.findOrCreate).toHaveBeenCalledWith({
      where: { title: 'Post Title' },
      defaults: {
        images: ['/path/to/image1.jpg', '/path/to/image2.jpg'],
        foodType: 'Food Type',
        postedBy: 'user_id',
        id: 'generated_id',
      },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Tạo bài đăng thành công',
    });
  });
});

describe('updatePost', () => {
  // Mock dependencies or setup necessary test data

  // Test case 1: Non-admin user updates their own post
  test('should update the post of a non-admin user', async () => {
    const req = {
      params: { pid: 'post_id' },
      body: { isAdmin: false, images: ['/path/to/image.jpg'] },
      user: { uid: 'user_id' },
      files: [{ path: '/path/to/image.jpg' }],
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.update function
    const dbMock = {
      Post: {
        update: jest.fn().mockResolvedValue([1]),
      },
    };

    // Call the updatePost function
    await updatePost(req, res, dbMock);

    expect(dbMock.Post.update).toHaveBeenCalledWith(
      { isAdmin: false, images: ['/path/to/image.jpg'] },
      { where: { id: 'post_id', postedBy: 'user_id' } }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      createdPost: 'Updated',
    });
  });

  // Test case 2: Admin user updates any post
  test('should update any post for an admin user', async () => {
    const req = {
      params: { pid: 'post_id' },
      body: { isAdmin: true, images: ['/path/to/image.jpg'] },
      user: { uid: 'admin_id' },
      files: [{ path: '/path/to/image.jpg' }],
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.update function
    const dbMock = {
      Post: {
        update: jest.fn().mockResolvedValue([1]),
      },
    };

    // Call the updatePost function
    await updatePost(req, res, dbMock);

    expect(dbMock.Post.update).toHaveBeenCalledWith(
      { isAdmin: true, images: ['/path/to/image.jpg'] },
      { where: { id: 'post_id' } }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      createdPost: 'Updated',
    });
  });

  // Test case 3: Post not found
  test('should return post not found message if post does not exist', async () => {
    const req = {
      params: { pid: 'non_existing_post_id' },
      body: { isAdmin: false },
      user: { uid: 'user_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.update function
    const dbMock = {
      Post: {
        update: jest.fn().mockResolvedValue([0]),
      },
    };

    // Call the updatePost function
    await updatePost(req, res, dbMock);

    expect(dbMock.Post.update).toHaveBeenCalledWith(
      { isAdmin: false },
      { where: { id: 'non_existing_post_id', postedBy: 'user_id' } }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      createdPost: 'Không tìm thấy bài viết',
    });
  });
});

describe('deletedPost', () => {
  // Test case 1: Delete a post by the owner
  test('should delete a post by the owner', async () => {
    const req = {
      params: { pid: 'post_id' },
      user: { uid: 'user_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.destroy function
    const dbMock = {
      Post: {
        destroy: jest.fn().mockResolvedValue(1),
      },
    };

    // Call the deletedPost function
    await deletedPost(req, res, dbMock);

    expect(dbMock.Post.destroy).toHaveBeenCalledWith({
      where: { id: 'post_id', postedBy: 'user_id' },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      createdPost: 'Deleted',
    });
  });

  // Test case 2: Post not found for the owner
  test('should return post not found message if post does not exist for the owner', async () => {
    const req = {
      params: { pid: 'non_existing_post_id' },
      user: { uid: 'user_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.destroy function
    const dbMock = {
      Post: {
        destroy: jest.fn().mockResolvedValue(0),
      },
    };

    // Call the deletedPost function
    await deletedPost(req, res, dbMock);

    expect(dbMock.Post.destroy).toHaveBeenCalledWith({
      where: { id: 'non_existing_post_id', postedBy: 'user_id' },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      createdPost: 'Không tìm thấy bài viết',
    });
  });
});

describe('deletedPostByAdmin', () => {
  // Test case 1: Delete any post by an admin
  test('should delete any post by an admin', async () => {
    const req = {
      params: { pid: 'post_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.destroy function
    const dbMock = {
      Post: {
        destroy: jest.fn().mockResolvedValue(1),
      },
    };

    // Call the deletedPostByAdmin function
    await deletedPostByAdmin(req, res, dbMock);

    expect(dbMock.Post.destroy).toHaveBeenCalledWith({
      where: { id: 'post_id' },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      createdPost: 'Deleted',
    });
  });

  // Test case 2: Post not found for an admin
  test('should return post not found message if post does not exist for an admin', async () => {
    const req = {
      params: { pid: 'non_existing_post_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.destroy function
    const dbMock = {
      Post: {
        destroy: jest.fn().mockResolvedValue(0),
      },
    };

    // Call the deletedPostByAdmin function
    await deletedPostByAdmin(req, res, dbMock);

    expect(dbMock.Post.destroy).toHaveBeenCalledWith({
      where: { id: 'non_existing_post_id' },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      createdPost: 'Không tìm thấy bài viết',
    });
  });
});

describe('getPosts', () => {
  // Test case 1: Get posts with default parameters
  test('should get posts with default parameters', async () => {
    const req = {
      query: {},
      user: { uid: 'user_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findAndCountAll function
    const dbMock = {
      Post: {
        findAndCountAll: jest.fn().mockResolvedValue({
          count: 2,
          rows: [
            { id: 1, title: 'Post 1' },
            { id: 2, title: 'Post 2' },
          ],
        }),
      },
      User: {},
      Category: {},
      Foodtype: {},
    };

    // Call the getPosts function
    await getPosts(req, res, dbMock);

    expect(dbMock.Post.findAndCountAll).toHaveBeenCalledWith({
      where: { postedBy: 'user_id' },
      limit: 10, // Assuming the default POST_LIMIT is 10
      offset: 0,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: dbMock.User,
          as: 'user',
          attributes: ['name', 'id', 'email'],
        },
        {
          model: dbMock.Category,
          as: 'categoryData',
          attributes: ['code', 'value'],
        },
        {
          model: dbMock.Foodtype,
          as: 'foodtypes',
          attributes: ['code', 'value'],
        },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: {
        count: 2,
        rows: [
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' },
        ],
      },
    });
  });

  // Test case 2: Get posts with custom parameters
  test('should get posts with custom parameters', async () => {
    const req = {
      query: {
        page: '2',
        limit: '5',
        order: 'createdAt ASC',
        title: 'keyword',
        q: 'search_query',
      },
      user: { uid: 'user_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findAndCountAll function
    const dbMock = {
      Post: {
        findAndCountAll: jest.fn().mockResolvedValue({
          count: 3,
          rows: [
            { id: 3, title: 'Post 3' },
            { id: 4, title: 'Post 4' },
            { id: 5, title: 'Post 5' },
          ],
        }),
      },
      User: {},
      Category: {},
      Foodtype: {},
    };

    // Call the getPosts function
    await getPosts(req, res, dbMock);

    expect(dbMock.Post.findAndCountAll).toHaveBeenCalledWith({
      where: {
        postedBy: 'user_id',
        title: { [Op.substring]: 'keyword' },
        [Op.or]: [
          { title: { [Op.substring]: 'search_query' } },
          { address: { [Op.substring]: 'search_query' } },
          { ['$user.name$']: { [Op.substring]: 'search_query' } },
        ],
      },
      limit: 5,
      offset: 5,
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: dbMock.User,
          as: 'user',
          attributes: ['name', 'id', 'email'],
        },
        {
          model: dbMock.Category,
          as: 'categoryData',
          attributes: ['code', 'value'],
        },
        {
          model: dbMock.Foodtype,
          as: 'foodtypes',
          attributes: ['code', 'value'],
        },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: {
        count: 3,
        rows: [
          { id: 3, title: 'Post 3' },
          { id: 4, title: 'Post 4' },
          { id: 5, title: 'Post 5' },
        ],
      },
    });
  });
});

describe('getPostsByAdmin', () => {
  // Test case 1: Get posts with default parameters
  test('should get posts by admin with default parameters', async () => {
    const req = {
      query: {},
      user: { uid: 'admin_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findAndCountAll function
    const dbMock = {
      Post: {
        findAndCountAll: jest.fn().mockResolvedValue({
          count: 2,
          rows: [
            { id: 1, title: 'Post 1' },
            { id: 2, title: 'Post 2' },
          ],
        }),
      },
      User: {},
      Category: {},
      Foodtype: {},
    };

    // Call the getPostsByAdmin function
    await getPostsByAdmin(req, res, dbMock);

    expect(dbMock.Post.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      limit: 10, // Assuming the default POST_LIMIT is 10
      offset: 0,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: dbMock.User,
          as: 'user',
          attributes: ['name', 'id', 'email'],
        },
        {
          model: dbMock.Category,
          as: 'categoryData',
          attributes: ['code', 'value'],
        },
        {
          model: dbMock.Foodtype,
          as: 'foodtypes',
          attributes: ['code', 'value'],
        },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: {
        count: 2,
        rows: [
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' },
        ],
      },
    });
  });

  // Test case 2: Get posts with custom parameters
  test('should get posts by admin with custom parameters', async () => {
    const req = {
      query: {
        page: '2',
        limit: '5',
        order: 'createdAt ASC',
        title: 'keyword',
        price: ['10,100'],
        distance: ['0,10'],
        area: ['50,100'],
        q: 'search_query',
        category: 'category_code',
      },
      user: { uid: 'admin_id' },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findAndCountAll function
    const dbMock = {
      Post: {
        findAndCountAll: jest.fn().mockResolvedValue({
          count: 3,
          rows: [
            { id: 3, title: 'Post 3' },
            { id: 4, title: 'Post 4' },
            { id: 5, title: 'Post 5' },
          ],
        }),
      },
      User: {},
      Category: {},
      Foodtype: {},
    };

    // Call the getPostsByAdmin function
    await getPostsByAdmin(req, res, dbMock);

    expect(dbMock.Post.findAndCountAll).toHaveBeenCalledWith({
      where: {
        title: { [Op.substring]: 'keyword' },
        price: { [Op.between]: [10, 100] },
        distance: { [Op.between]: [0, 10] },
        area: { [Op.between]: [50, 100] },
        category: 'category_code',
        [Op.or]: [
          { title: { [Op.substring]: 'search_query' } },
          { address: { [Op.substring]: 'search_query' } },
          { ['$user.name$']: { [Op.substring]: 'search_query' } },
        ],
      },
      limit: 5,
      offset: 5,
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: dbMock.User,
          as: 'user',
          attributes: ['name', 'id', 'email'],
        },
        {
          model: dbMock.Category,
          as: 'categoryData',
          attributes: ['code', 'value'],
        },
        {
          model: dbMock.Foodtype,
          as: 'foodtypes',
          attributes: ['code', 'value'],
        },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      posts: {
        count: 3,
        rows: [
          { id: 3, title: 'Post 3' },
          { id: 4, title: 'Post 4' },
          { id: 5, title: 'Post 5' },
        ],
      },
    });
  });
});

describe('getHome', () => {
  // Test case 1: Get home posts
  test('should get home posts', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findAll function
    const dbMock = {
      Post: {
        findAll: jest.fn().mockResolvedValue([
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' },
        ]),
      },
      User: {},
      Category: {},
      Foodtype: {},
    };

    // Call the getHome function
    await getHome(req, res, dbMock);

    expect(dbMock.Post.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: dbMock.User,
          as: 'user',
          attributes: ['name', 'id', 'email'],
        },
        {
          model: dbMock.Category,
          as: 'categoryData',
          attributes: ['code', 'value'],
        },
        {
          model: dbMock.Foodtype,
          as: 'foodtypes',
          attributes: ['code', 'value'],
        },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ],
    });
  });
});

describe('ratings', () => {
  // Test case 1: Update existing vote
  test('should update existing vote', async () => {
    const req = {
      user: { uid: 'user_id' },
      body: { pid: 1, score: 4 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock db.Post.findOne, db.Vote.findOne, db.Vote.update, db.Vote.findAll, db.Post.update functions
    const dbMock = {
      Post: {
        findOne: jest.fn().mockResolvedValue({ id: 1, title: 'Post 1' }),
        update: jest.fn(),
      },
      Vote: {
        findOne: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue([1]),
        create: jest.fn(),
        findAll: jest.fn().mockResolvedValue([{ score: 4 }, { score: 3 }]),
      },
    };

    // Call the ratings function
    await ratings(req, res, dbMock);

    expect(dbMock.Vote.update).toHaveBeenCalledWith(
      { pid: 1, score: 4 },
      { where: { pid: 1, uid: 'user_id' } }
    );
    expect(dbMock.Vote.findAll).toHaveBeenCalledWith({
      where: { pid: 1 },
      raw: true,
    });
    expect(dbMock.Post.update).toHaveBeenCalledWith(
      { star: 4 },
      { where: { id: 1 } }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [1],
    });
  });

  // Test case 2: Create new vote
  test('should create new vote', async () => {
    const req = {
      user: { uid: 'user_id' },
      body: { pid: 1, score: 4 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock db.Post.findOne, db.Vote.findOne, db.Vote.create, db.Vote.findAll, db.Post.update functions
    const dbMock = {
      Post: {
        findOne: jest.fn().mockResolvedValue({ id: 1, title: 'Post 1' }),
        update: jest.fn(),
      },
      Vote: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        findAll: jest.fn().mockResolvedValue([{ score: 4 }, { score: 3 }]),
      },
    };

    // Call the ratings function
    await ratings(req, res, dbMock);

    expect(dbMock.Vote.create).toHaveBeenCalledWith({
      pid: 1,
      score: 4,
      uid: 'user_id',
    });
    expect(dbMock.Vote.findAll).toHaveBeenCalledWith({
      where: { pid: 1 },
      raw: true,
    });
    expect(dbMock.Post.update).toHaveBeenCalledWith(
      { star: 4 },
      { where: { id: 1 } }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {},
    });
  });
});

describe('getPostById', () => {
  // Test case 1: Get post by ID
  test('should get post by ID', async () => {
    const req = {
      params: { pid: 1 },
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findOne and response.increment functions
    const dbMock = {
      Post: {
        findOne: jest.fn().mockResolvedValue({ id: 1, title: 'Post 1' }),
      },
    };

    // Call the getPostById function
    await getPostById(req, res, dbMock);

    expect(dbMock.Post.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      include: [
        {
          model: dbMock.User,
          as: 'user',
          attributes: ['name', 'id', 'email', 'phone', 'image'],
        },
        {
          model: dbMock.Category,
          as: 'categoryData',
          attributes: ['code', 'value', 'slug'],
        },
        {
          model: dbMock.Comment,
          as: 'comments',
          include: [
            {
              model: dbMock.User,
              as: 'commentator',
              attributes: ['name', 'image'],
            },
          ],
        },
        {
          model: dbMock.Vote,
          as: 'votes',
          include: [
            {
              model: dbMock.User,
              as: 'userData',
              attributes: ['name', 'id', 'image'],
            },
          ],
        },
      ],
    });
    expect(response.increment).toHaveBeenCalledWith('views', { by: 1 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      post: { id: 1, title: 'Post 1' },
    });
  });

  // Add more test cases if needed
});

describe('getDashboard', () => {
  // Test case 1: Get dashboard data
  test('should get dashboard data', async () => {
    const req = {
      query: {},
    };
    const res = {
      json: jest.fn(),
    };

    // Mock db.Post.findAll, db.User.findAll, db.Visited.findAll functions
    const dbMock = {
      Post: {
        findAll: jest.fn().mockResolvedValue([
          { createdAt: '01-01-22', counter: 5 },
          { createdAt: '02-01-22', counter: 3 },
        ]),
      },
      User: {
        findAll: jest.fn().mockResolvedValue([
          { createdAt: '01-01-22', counter: 10 },
          { createdAt: '02-01-22', counter: 5 },
        ]),
      },
      Visited: {
        findAll: jest.fn().mockResolvedValue([{ views: 100 }]),
      },
    };

    // Call the getDashboard function
    await getDashboard(req, res, dbMock);

    expect(dbMock.Post.findAll).toHaveBeenCalledWith({
      where: {},
      attributes: [
        [
          sequelize.fn('date_format', sequelize.col('createdAt'), '%m-%y'),
          'createdAt',
        ],
        [sequelize.fn('count', sequelize.col('id')), 'counter'],
      ],
      group: 'createdAt',
      order: [['createdAt', 'ASC']],
    });
    expect(dbMock.User.findAll).toHaveBeenCalledWith({
      where: {},
      attributes: [
        [
          sequelize.fn('date_format', sequelize.col('createdAt'), '%m-%y'),
          'createdAt',
        ],
        [sequelize.fn('count', sequelize.col('id')), 'counter'],
      ],
      group: 'createdAt',
      order: [['createdAt', 'ASC']],
    });
    expect(dbMock.Visited.findAll).toHaveBeenCalledWith({
      attributes: [[sequelize.fn('sum', sequelize.col('times')), 'views']],
      raw: true,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      chartData: {
        rent: [
          { createdAt: '01-01-22', counter: 5 },
          { createdAt: '02-01-22', counter: 3 },
        ],
        eatery: [
          { createdAt: '01-01-22', counter: 5 },
          { createdAt: '02-01-22', counter: 3 },
        ],
        other: [
          { createdAt: '01-01-22', counter: 5 },
          { createdAt: '02-01-22', counter: 3 },
        ],
        views: { views: 100 },
        postCount: { postCount: 10 },
        userCount: { userCount: 5 },
        user: [
          { createdAt: '01-01-22', counter: 10 },
          { createdAt: '02-01-22', counter: 5 },
        ],
      },
    });
  });
});
