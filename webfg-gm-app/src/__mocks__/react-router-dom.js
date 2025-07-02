const React = require('react');

module.exports = {
  BrowserRouter: ({ children }) => React.createElement('div', null, children),
  Routes: ({ children }) => React.createElement('div', null, children),
  Route: ({ element }) => element,
  Link: ({ children, to }) => React.createElement('a', { href: to }, children),
  NavLink: ({ children, to, className, onClick }) => React.createElement('a', { href: to, className, onClick }, children),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' })
};