const { createComment } = require('../../controllers/comment');
const db = require('../../models');
const asyncHandler = require('express-async-handler');

// Mock the Express request and response objects
const req = {
  body: {
    pid: 'post-id',
    content: 'Comment content',
  },
  user: {
    uid: 'user-id',
  },
};
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};

describe('createComment', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  //TC1
  test('should create a new comment', async () => {
    // Mock the response from the Comment model
    const mockComment = {
      id: 'comment-id',
      pid: req.body.pid,
      content: req.body.content,
      uid: req.user.uid,
    };
    jest.spyOn(db.Comment, 'create').mockResolvedValue(mockComment);

    // Call the createComment function
    await createComment(req, res);

    // Verify the response
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mes: 'Created comment',
    });
  });
  //TC2
  test('should handle missing product ID', async () => {
    // Modify the request to have a missing product ID
    const modifiedReq = { ...req, body: { content: req.body.content } };

    // Call the createComment function
    await createComment(modifiedReq, res);

    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      err: 1,
      mes: 'Missing product ID',
    });
  });
  //TC3
  test('should handle error when creating comment', async () => {
    // Mock the Comment.create method to throw an error
    const errorMessage = 'Comment creation failed';
    jest.spyOn(db.Comment, 'create').mockRejectedValue(new Error(errorMessage));

    // Call the createComment function
    await createComment(req, res);

    // Verify the response
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      mes: 'Không tìm thấy bài viết!',
    });
  });
});
