const { getFoodtype } = require('../../controllers/foodtype');
const db = require('../../models');
const asyncHandler = require('express-async-handler');

// Mock the Express request and response objects
const req = {};
const res = {
  json: jest.fn().mockReturnThis(),
};

describe('getFoodtype', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  //tc1
  test('should return food types', async () => {
    // Mock the response from the database
    const mockFoodtypes = [
      { id: 1, name: 'Food Type 1' },
      { id: 2, name: 'Food Type 2' },
    ];
    jest.spyOn(db.Foodtype, 'findAll').mockResolvedValue(mockFoodtypes);

    // Call the getFoodtype function
    await getFoodtype(req, res);

    // Verify the response
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      foodtypes: mockFoodtypes,
    });
  });
  //tc2
  test('should handle error when database query fails', async () => {
    // Mock the database query to throw an error
    const errorMessage = 'Database query failed';
    jest
      .spyOn(db.Foodtype, 'findAll')
      .mockRejectedValue(new Error(errorMessage));

    // Call the getFoodtype function
    await getFoodtype(req, res);

    // Verify the response
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      foodtypes: 'Cannot get foodtype',
    });
  });
});
