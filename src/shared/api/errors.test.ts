import * as HttpClientError from '@effect/platform/HttpClientError';
import { HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  getResponseError,
  NetworkError,
  NotFoundError,
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
    const error = new NetworkError({ traceId: 'test-trace-id' });
    expect(error._tag).toBe('NetworkError');
    expect(error.traceId).toBe('test-trace-id');
  });

  it('ValidationError should have correct tag', () => {
    const error = new ValidationError({ problemDetail: testProblemDetail });
    expect(error._tag).toBe('ValidationError');
    expect(error.problemDetail?.detail).toBe('test');
  });

  it('NotFoundError should have correct tag and resource', () => {
    const error = new NotFoundError({
      problemDetail: testProblemDetail,
      resource: 'user',
    });
    expect(error._tag).toBe('NotFoundError');
    expect(error.problemDetail?.detail).toBe('test');
    expect(error.resource).toBe('user');
  });

  it('should allow access to all problemDetail fields', () => {
    const error = new ValidationError({ problemDetail: testProblemDetail });
    expect(error.problemDetail?.type).toBe('https://example.com/error');
    expect(error.problemDetail?.title).toBe('Test Error');
    expect(error.problemDetail?.status).toBe(500);
    expect(error.problemDetail?.detail).toBe('test');
    expect(error.problemDetail?.instance).toBe('/test/123');
  });
});

describe('getResponseError', () => {
  function createMockResponseError(
    status: number,
    body: unknown,
    headers: Record<string, string> = {},
  ) {
    const bodyText = JSON.stringify(body);
    const request = HttpClientRequest.get('https://test.com');
    const response = HttpClientResponse.fromWeb(
      request,
      new Response(bodyText, {
        status,
        headers: { 'content-type': 'application/json', ...headers },
      }),
    );
    return new HttpClientError.ResponseError({
      request,
      response,
      reason: 'StatusCode',
    });
  }

  const runtime = ManagedRuntime.make(Layer.empty);

  const runError = <E>(effect: Effect.Effect<never, E>) =>
    runtime.runPromise(Effect.flip(effect));

  const problemDetail: ProblemDetail = {
    type: 'https://example.com/error',
    title: 'Error',
    detail: 'Something went wrong',
  };

  it('should return NotFoundError for 404 status', async () => {
    const error = createMockResponseError(404, problemDetail);
    const result = await runError(getResponseError(error, 'trace-1', 'user'));
    expect(result._tag).toBe('NotFoundError');
    expect((result as NotFoundError).resource).toBe('user');
  });

  it('should return ValidationError for 422 status', async () => {
    const error = createMockResponseError(422, problemDetail);
    const result = await runError(getResponseError(error, 'trace-2'));
    expect(result._tag).toBe('ValidationError');
  });

  it('should return ValidationError for validation problem detail type', async () => {
    const validationProblem = {
      ...problemDetail,
      type: 'https://example.com/validation-error',
    };
    const error = createMockResponseError(400, validationProblem);
    const result = await runError(getResponseError(error, 'trace-3'));
    expect(result._tag).toBe('ValidationError');
  });

  it('should return NetworkError for other statuses', async () => {
    const error = createMockResponseError(500, problemDetail);
    const result = await runError(getResponseError(error, 'trace-4'));
    expect(result._tag).toBe('NetworkError');
  });

  it('should handle non-JSON responses gracefully', async () => {
    const request = HttpClientRequest.get('https://test.com');
    const response = HttpClientResponse.fromWeb(
      request,
      new Response('Not Found', {
        status: 404,
        headers: { 'content-type': 'text/plain' },
      }),
    );
    const error = new HttpClientError.ResponseError({
      request,
      response,
      reason: 'StatusCode',
    });
    const result = await runError(getResponseError(error, 'trace-5', 'user'));
    expect(result._tag).toBe('NotFoundError');
    expect((result as NotFoundError).resource).toBe('user');
  });
});
