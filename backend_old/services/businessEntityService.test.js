import { getBusinessEntity } from './businessEntityService';
import { Pool } from 'pg';

// Mock the pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('businessEntityService', () => {
  let pool;

  beforeAll(() => {
    pool = new Pool();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getBusinessEntity should return a business entity', async () => {
    const mockEntity = { entity_id: '1', name: 'Test Entity', address: '123 Test St', phone: '123-456-7890' };
    pool.query.mockResolvedValue({ rows: [mockEntity] });

    const result = await getBusinessEntity('1');
    expect(result).toEqual(mockEntity);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM businessentity WHERE entity_id = $1', ['1']);
  });

  test('getBusinessEntity should throw an error if entity not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(getBusinessEntity('1')).rejects.toThrow('Business entity not found');
  });

  test('getBusinessEntity should throw an error if ID is not a string', async () => {
    await expect(getBusinessEntity(1)).rejects.toThrow('Invalid ID: ID must be a string');
  });
});