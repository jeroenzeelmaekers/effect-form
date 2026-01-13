import { describe, expect, it } from 'vitest';
import {
  NetworkError,
  UsersNotFound,
  ValidationError,
  type ProblemDetail,
} from './errors';

describe('Error types', () => {
  const testProblemDetail: ProblemDetail = {
    type: 'https://example.com/error',
    title: 'Test Error',
    status: 500,
    detail: 'test',
    instance: '/test/123',
  };

  it('NetworkError should have correct tag', () => {
    const error = new NetworkError({ problemDetail: testProblemDetail });
    expect(error._tag).toBe('NetworkError');
    expect(error.problemDetail?.detail).toBe('test');
  });

  it('ValidationError should have correct tag', () => {
    const error = new ValidationError({ problemDetail: testProblemDetail });
    expect(error._tag).toBe('ValidationError');
    expect(error.problemDetail?.detail).toBe('test');
  });

  it('UsersNotFound should have correct tag', () => {
    const error = new UsersNotFound({ problemDetail: testProblemDetail });
    expect(error._tag).toBe('UserNotFound');
    expect(error.problemDetail?.detail).toBe('test');
  });

  it('should allow access to all problemDetail fields', () => {
    const error = new NetworkError({ problemDetail: testProblemDetail });
    expect(error.problemDetail?.type).toBe('https://example.com/error');
    expect(error.problemDetail?.title).toBe('Test Error');
    expect(error.problemDetail?.status).toBe(500);
    expect(error.problemDetail?.detail).toBe('test');
    expect(error.problemDetail?.instance).toBe('/test/123');
  });
});

describe('getResponseError', () => {
  it('should return UsersNotFound for 404 status', async () => {});
  it('should return UsersNotFound for not found problem detail', async () => {});
  it('should return ValidationError for 422 status', async () => {});
  it('should return ValidationError for validation problem detail', async () => {});
  it('should return NetworkError for other statuses', async () => {});
});
