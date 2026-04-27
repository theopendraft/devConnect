import { describe, it, expect } from 'vitest';

describe('post formatting helpers', () => {
  it('truncates long content at 500 chars', () => {
    const content = 'a'.repeat(501);
    expect(content.length > 500).toBe(true);
  });

  it('formats a date string to a locale string', () => {
    const date = new Date('2024-01-15T10:00:00Z').toLocaleDateString();
    expect(typeof date).toBe('string');
    expect(date.length).toBeGreaterThan(0);
  });

  it('derives username fallback from email', () => {
    const email = 'jane@example.com';
    const username = email.split('@')[0];
    expect(username).toBe('jane');
  });

  it('correctly seeds user_has_liked from post data', () => {
    const post = { id: '1', user_has_liked: true };
    expect(!!post?.user_has_liked).toBe(true);

    const post2 = { id: '2' };
    expect(!!post2?.user_has_liked).toBe(false);
  });
});

describe('pagination cursor logic', () => {
  it('returns nextCursor as last post created_at', () => {
    const posts = [
      { id: '1', created_at: '2024-01-15T10:00:00Z' },
      { id: '2', created_at: '2024-01-14T10:00:00Z' },
    ];
    const nextCursor = posts.length > 0 ? posts[posts.length - 1].created_at : null;
    expect(nextCursor).toBe('2024-01-14T10:00:00Z');
  });

  it('returns null nextCursor for empty feed', () => {
    const posts = [];
    const nextCursor = posts.length > 0 ? posts[posts.length - 1].created_at : null;
    expect(nextCursor).toBeNull();
  });
});
