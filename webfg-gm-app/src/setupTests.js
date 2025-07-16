// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock HTMLCanvasElement for tests
const mockContext = {
  clearRect: jest.fn(),
  fillStyle: '',
  fillRect: jest.fn(),
  strokeStyle: '',
  lineWidth: 1,
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  font: '',
  textAlign: '',
  textBaseline: '',
  measureText: jest.fn(() => ({ width: 10 })),
  drawImage: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  rect: jest.fn(),
  closePath: jest.fn()
};

// Mock getContext for all canvas elements with fallback
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = jest.fn(function(contextType) {
  if (contextType === '2d') {
    return mockContext;
  }
  return originalGetContext?.call(this, contextType) || mockContext;
});

// Mock getBoundingClientRect for canvas
HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn(() => ({
  top: 0,
  left: 0,
  width: 800,
  height: 800,
  right: 800,
  bottom: 800
}));
