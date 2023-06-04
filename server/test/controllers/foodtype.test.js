const request = require('supertest');
const express = require('express');
const { getFoodtype } = require('../../controllers/foodtype'); // Replace with the actual file name
const db = require('../../models/index');

const app = express();
app.use(express.json());
app.get('/foodtype', getFoodtype);

describe('getFoodtype', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return foodtypes and success true', async () => {
    const mockFoodtypes = [
      { id: 1, name: 'Pizza' },
      { id: 2, name: 'Burger' },
    ];

    db.Foodtype.findAll = jest.fn().mockResolvedValue(mockFoodtypes);

    const response = await request(app).get('/foodtype');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      foodtypes: mockFoodtypes,
    });
    expect(db.Foodtype.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return success false and error message when unable to get foodtypes', async () => {
    db.Foodtype.findAll = jest.fn().mockResolvedValue(null);

    const response = await request(app).get('/foodtype');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: false,
      foodtypes: 'Cannot get foodtype',
    });
    expect(db.Foodtype.findAll).toHaveBeenCalledTimes(1);
  });
});
