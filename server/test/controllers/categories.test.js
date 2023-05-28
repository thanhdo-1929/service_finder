const db = require('../models');
const app = require('../app');
const request = require('supertest');

describe('getCategories', () => {
  it('should return categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Category 1' },
      { id: 2, name: 'Category 2' },
      { id: 3, name: 'Category 3' },
    ];
    jest.spyOn(db.Category, 'findAll').mockResolvedValue(mockCategories);

    const res = await request(app).get('/categories');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.categories).toEqual(mockCategories);
  });

  it('should return error if cannot get categories', async () => {
    jest
      .spyOn(db.Category, 'findAll')
      .mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/categories');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(false);
    expect(res.body.categories).toBe('Cannot get categories');
  });
});
