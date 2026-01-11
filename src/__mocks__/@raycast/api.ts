// Mock implementation of @raycast/api for testing

export const LocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  allItems: jest.fn(),
};

export const showToast = jest.fn();
export const Toast = {
  Style: {
    Success: "success",
    Failure: "failure",
  },
};

export const Icon = {};
export const Color = {};
export const List = {};
export const Action = {};
export const ActionPanel = {};
export const Form = {};
export const Detail = {};
export const MenuBarExtra = {};
export const open = jest.fn();
