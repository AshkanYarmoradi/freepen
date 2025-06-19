// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the crypto.subtle API for tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(() => {
        return Promise.resolve(new ArrayBuffer(32));
      }),
    },
  },
});

// Mock TextEncoder
global.TextEncoder = class {
  encode(text) {
    return new Uint8Array(text.split('').map(char => char.charCodeAt(0)));
  }
};

// Mock fetch API for tests
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Map(),
  })
);
