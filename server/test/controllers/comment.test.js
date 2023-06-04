const { createComment } = require('../../controllers/comment');
const db = require('../../models/index');
const httpMocks = require('node-mocks-http');
const uniqid = require('uniqid');
jest.mock('../../models');

describe('createComment', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  it('should return post not found with post id is aaaaaaa and provide a comment', async () => {
    req.body = { pid: 'aaaaaaa', content: 'Test comment' };
    req.user = { uid: '123' };
    db.Comment.create.mockResolvedValue(null);

    await createComment(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: false,
      mes: 'Không tìm thấy bài viết!',
    });
  });

  it('should create a comment and return Created comment', async () => {
    req.body = { pid: 'adsa213d', content: 'Test comment' };
    req.user = { uid: '123' };
    const commentId = uniqid();
    db.Comment.create.mockResolvedValue({ id: 'idTest' });

    await createComment(req, res, next);

    expect(db.Comment.create).toHaveBeenCalledWith({
      pid: 'adsa213d',
      content: 'Test comment',
      uid: '123',
      id: 'idTest',
    });
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      mes: 'Created comment',
    });
  });

  it('should return missing input if pid is missing', async () => {
    req.body = { pid: '', content: 'test comment' };
    req.user = { uid: '123' };

    await createComment(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      err: 1,
      mes: 'missing input',
    });
  });

  it('should return missing input with post id is aaaaaaa if content is missing', async () => {
    req.body = { pid: 'aaaaaaa', content: '' };
    req.user = { uid: '123' };

    await createComment(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      err: 1,
      mes: 'missing input',
    });
  });

  it('should return missing input with post id is adsa213d if content is missing', async () => {
    req.body = { pid: 'adsa213d', content: '' };
    req.user = { uid: '123' };

    await createComment(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      err: 1,
      mes: 'missing input',
    });
  });

  it('should return missing input if post id and content are missing', async () => {
    req.body = { pid: '', content: '' };
    req.user = { uid: '123' };

    await createComment(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      err: 1,
      mes: 'missing input',
    });
  });
});
