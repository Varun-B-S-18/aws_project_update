import request from 'supertest';
import { app } from '../src/app';
import { bedrockService } from '../src/services/bedrock';
import * as dynamodbService from '../src/services/dynamodb';

// Mock the BedrockService so tests do not make external AWS calls or incur charges
jest.mock('../src/services/bedrock', () => ({
  bedrockService: {
    generateReply: jest.fn(),
    generateResponse: jest.fn(),
    getModelId: jest.fn().mockReturnValue('amazon.nova-micro-v1:0'),
    getRegion: jest.fn().mockReturnValue('ap-southeast-2'),
    checkConfiguration: jest.fn().mockReturnValue({
      ok: true,
      region: 'ap-southeast-2',
      modelId: 'amazon.nova-micro-v1:0',
    }),
    testInvocation: jest.fn(),
  },
  generateReply: jest.fn(),
}));

// Mock DynamoDB service so unit tests run deterministically offline
jest.mock('../src/services/dynamodb', () => ({
  getMemories: jest.fn(),
  saveMemory: jest.fn(),
  getMemoryById: jest.fn(),
  updateMemory: jest.fn(),
  deleteMemory: jest.fn(),
  deleteAllMemories: jest.fn(),
}));

const AUTH_HEADER = { Authorization: 'Bearer test-token-test-user-1' };

describe('Backend API - Secure Long-Term Memory Assistant Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dynamodbService.getMemories as jest.Mock).mockResolvedValue([]);
    (dynamodbService.saveMemory as jest.Mock).mockImplementation((userId, content, category) =>
      Promise.resolve({
        userId,
        recordId: 'memory-1234',
        content,
        category,
        createdAt: new Date().toISOString(),
      })
    );
  });

  describe('GET /api/health (Public Endpoint)', () => {
    it('should return status ok with 200 status code', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/health/bedrock (Public Endpoint)', () => {
    it('should return configured status without invoking model when test flag is absent', async () => {
      const response = await request(app).get('/api/health/bedrock');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('configured');
      expect(response.body.region).toBe('ap-southeast-2');
      expect(response.body.modelId).toBe('amazon.nova-micro-v1:0');
      expect(bedrockService.testInvocation).not.toHaveBeenCalled();
    });

    it('should return connected status when test=true and invocation succeeds', async () => {
      (bedrockService.testInvocation as jest.Mock).mockResolvedValueOnce({
        ok: true,
        latencyMs: 142,
        modelId: 'amazon.nova-micro-v1:0',
        responseSnippet: 'pong',
      });

      const response = await request(app).get('/api/health/bedrock?test=true');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('connected');
      expect(response.body.latencyMs).toBe(142);
      expect(bedrockService.testInvocation).toHaveBeenCalledTimes(1);
    });

    it('should report configuration error when env vars are missing', async () => {
      (bedrockService.checkConfiguration as jest.Mock).mockReturnValueOnce({
        ok: false,
        error: 'Missing required AWS Region configuration.',
      });

      const response = await request(app).get('/api/health/bedrock');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.code).toBe('CONFIGURATION_ERROR');
    });

    it('should return safe diagnostic error when test=true fails with AWS error', async () => {
      const awsError = new Error('AccessDeniedException: User is not authorized');
      awsError.name = 'AccessDeniedException';
      (bedrockService.testInvocation as jest.Mock).mockRejectedValueOnce(awsError);

      const response = await request(app).get('/api/health/bedrock?test=true');

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.code).toBe('ACCESS_DENIED');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('Authentication Enforcement', () => {
    it('should reject unauthenticated chat requests with 401 Unauthorized', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello without token' });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated memory requests with 401 Unauthorized', async () => {
      const response = await request(app).get('/api/memories');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/chat (Authenticated)', () => {
    it('should return 200 with reply and message for a valid single message without memories', async () => {
      const mockAiReply = 'Artificial intelligence is computer systems performing human-like tasks.';
      (bedrockService.generateReply as jest.Mock).mockResolvedValueOnce(mockAiReply);

      const response = await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: 'Explain artificial intelligence in simple terms.' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        reply: mockAiReply,
        message: mockAiReply,
      });
      expect(bedrockService.generateReply).toHaveBeenCalledWith(
        'Explain artificial intelligence in simple terms.'
      );
    });

    it('should augment user prompt with retrieved memories when memories exist', async () => {
      const mockAiReply = 'Your secret project code name is BlueTiger739.';
      (bedrockService.generateReply as jest.Mock).mockResolvedValueOnce(mockAiReply);
      (dynamodbService.getMemories as jest.Mock).mockResolvedValueOnce([
        {
          userId: 'test-user-1',
          recordId: 'mem-1',
          content: 'My secret project code name is BlueTiger739.',
          createdAt: new Date().toISOString(),
        },
      ]);

      const response = await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: 'What is my secret project code name?' });

      expect(response.status).toBe(200);
      expect(response.body.reply).toBe(mockAiReply);
      expect(response.body.memoriesUsed).toBe(true);
      expect(bedrockService.generateReply).toHaveBeenCalledWith(
        expect.stringContaining('BlueTiger739')
      );
    });

    it('should extract and persist personal project code names as long-term memories', async () => {
      const mockAiReply = 'I will remember that your secret project code name is BlueTiger739.';
      (bedrockService.generateReply as jest.Mock).mockResolvedValueOnce(mockAiReply);

      await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: 'My secret project code name is BlueTiger739.' });

      expect(dynamodbService.saveMemory).toHaveBeenCalledWith(
        'test-user-1',
        'My secret project code name is BlueTiger739.',
        'project'
      );
    });

    it('should not save transient questions as memories', async () => {
      const mockAiReply = 'Binary search runs in O(log n) time.';
      (bedrockService.generateReply as jest.Mock).mockResolvedValueOnce(mockAiReply);

      await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: 'What is the time complexity of binary search?' });

      expect(dynamodbService.saveMemory).not.toHaveBeenCalled();
    });

    it('should return 400 when message is empty string', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message cannot be empty' });
      expect(bedrockService.generateReply).not.toHaveBeenCalled();
    });

    it('should return 400 when message exceeds max allowed length', async () => {
      const longMessage = 'A'.repeat(10001);
      const response = await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: longMessage });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Message exceeds maximum allowed length');
      expect(bedrockService.generateReply).not.toHaveBeenCalled();
    });

    it('should return friendly error when AWS model access is not granted (ValidationException)', async () => {
      const valError = new Error('Operation not allowed');
      valError.name = 'ValidationException';
      (bedrockService.generateReply as jest.Mock).mockRejectedValueOnce(valError);

      const response = await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: 'Hello Bedrock' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('MODEL_ACCESS_REQUIRED');
      expect(response.body.error).toContain('Model access is not granted');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should return 500 and safe error message when general Bedrock service fails', async () => {
      (bedrockService.generateReply as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout connecting to AWS Bedrock')
      );

      const response = await request(app)
        .post('/api/chat')
        .set(AUTH_HEADER)
        .send({ message: 'Explain quantum computing' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Unable to generate a response from Amazon Bedrock. Please try again.',
        code: 'BEDROCK_INVOCATION_FAILED',
      });
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('Memory Management Endpoints (/api/memories)', () => {
    it('GET /api/memories should retrieve memories for authenticated user only', async () => {
      const mockMemories = [
        {
          userId: 'test-user-1',
          recordId: 'mem-1',
          content: 'Prefers dark mode',
          createdAt: new Date().toISOString(),
        },
      ];
      (dynamodbService.getMemories as jest.Mock).mockResolvedValueOnce(mockMemories);

      const response = await request(app)
        .get('/api/memories')
        .set(AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.memories).toEqual(mockMemories);
      expect(dynamodbService.getMemories).toHaveBeenCalledWith('test-user-1');
    });

    it('POST /api/memory should save a memory for authenticated user', async () => {
      const response = await request(app)
        .post('/api/memory')
        .set(AUTH_HEADER)
        .send({ content: 'I prefer TypeScript over JavaScript' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Memory saved successfully');
      expect(dynamodbService.saveMemory).toHaveBeenCalledWith(
        'test-user-1',
        'I prefer TypeScript over JavaScript',
        undefined
      );
    });

    it('PUT /api/memories/:recordId should update a memory for authenticated user', async () => {
      (dynamodbService.updateMemory as jest.Mock).mockResolvedValueOnce({
        userId: 'test-user-1',
        recordId: 'mem-1',
        content: 'Updated content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .put('/api/memories/mem-1')
        .set(AUTH_HEADER)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Memory updated successfully');
      expect(dynamodbService.updateMemory).toHaveBeenCalledWith(
        'test-user-1',
        'mem-1',
        'Updated content'
      );
    });

    it('DELETE /api/memories/:recordId should delete a single memory', async () => {
      (dynamodbService.deleteMemory as jest.Mock).mockResolvedValueOnce(true);

      const response = await request(app)
        .delete('/api/memories/mem-1')
        .set(AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Memory deleted successfully');
      expect(dynamodbService.deleteMemory).toHaveBeenCalledWith('test-user-1', 'mem-1');
    });

    it('DELETE /api/memories should clear all memories for user', async () => {
      (dynamodbService.deleteAllMemories as jest.Mock).mockResolvedValueOnce(5);

      const response = await request(app)
        .delete('/api/memories')
        .set(AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(5);
      expect(dynamodbService.deleteAllMemories).toHaveBeenCalledWith('test-user-1');
    });

    it('should deny access when a user attempts to fetch another user memories by ID', async () => {
      const response = await request(app)
        .get('/api/memories/user-victim-999')
        .set(AUTH_HEADER);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });
});
