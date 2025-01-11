import { extractLinks } from '../../src/extractors';
import { LinkInfo } from '../../src/core/types';

describe('MDX/JSX Link Extraction', () => {
  it('should extract MDX components', () => {
    const content = `
import Component from './Component.mdx';

export default function Page() {
  return (
    <div>
      <Component />
      <img src="/images/hero.jpg" alt="Hero" />
    </div>
  );
}
    `;
    const links = extractLinks(content, 'page.mdx');
    expect(links).toEqual([
      { 
        url: './Component.mdx',
        location: expect.any(Object)
      },
      {
        url: '/images/hero.jpg',
        location: expect.any(Object)
      }
    ]);
  });

  it('should extract JSX imports', () => {
    const content = `
import React from 'react';
import Component from './Component.jsx';
import styles from './styles.module.css';

export default function App() {
  return (
    <div className={styles.container}>
      <Component />
      <img src="/logo.png" alt="Logo" />
    </div>
  );
}
    `;
    const links = extractLinks(content, 'App.jsx');
    expect(links).toEqual([
      {
        url: './Component.jsx',
        location: expect.any(Object)
      },
      {
        url: './styles.module.css',
        location: expect.any(Object)
      },
      {
        url: '/logo.png',
        location: expect.any(Object)
      }
    ]);
  });

  it('should extract JS imports', () => {
    const content = `
import { useState } from 'react';
import Component from './Component.js';
import styles from './styles.module.css';

export default function App() {
  return (
    <div className={styles.container}>
      <Component />
      <img src="/logo.png" alt="Logo" />
    </div>
  );
}
    `;
    const links = extractLinks(content, 'App.js');
    expect(links).toEqual([
      {
        url: './Component.js',
        location: expect.any(Object)
      },
      {
        url: './styles.module.css',
        location: expect.any(Object)
      },
      {
        url: '/logo.png',
        location: expect.any(Object)
      }
    ]);
  });
});
