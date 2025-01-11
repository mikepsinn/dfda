import React from 'react';

interface CustomLinkProps {
  to: string;
}

interface RouterLinkProps {
  path: string;
}

const CustomLink: React.FC<CustomLinkProps> = ({ to }) => (
  <a href={to}>Custom Link</a>
);

const RouterLink: React.FC<RouterLinkProps> = ({ path }) => (
  <a href={path}>Router Link</a>
);

const SampleComponent: React.FC = () => {
  return (
    <div>
      <h1>Sample Component</h1>
      
      {/* External Links */}
      <a href="https://www.google.com">Google</a>
      <a href="https://this-is-an-invalid-domain-12345.com">Invalid Link</a>
      
      {/* Internal Links */}
      <a href="../docs/api.md">API Docs</a>
      <a href="./components/Button.tsx">Button Component</a>
      
      {/* Dynamic Links */}
      <img src={`/images/logo.png`} alt="Logo" />
      <link rel="stylesheet" href="/styles/main.css" />
      
      {/* Links in Props */}
      <CustomLink to="https://example.com" />
      <RouterLink path="/dashboard" />
      
      {/* Invalid Links */}
      <a href="">Empty Link</a>
      <img src="" alt="Missing Image" />
    </div>
  );
};

export default SampleComponent; 