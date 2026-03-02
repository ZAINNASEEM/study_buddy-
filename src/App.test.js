// Mock react-router-dom so tests can run in the Node/Jest environment
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Outlet: () => null,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => (path) => {},
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}), { virtual: true });

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app brand', () => {
  render(<App />);
  const linkElements = screen.getAllByText(/Study-Buddy/i);
  expect(linkElements.length).toBeGreaterThan(0);
});
