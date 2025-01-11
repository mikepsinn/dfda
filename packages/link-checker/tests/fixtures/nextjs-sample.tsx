import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Component.module.css';
import api from '../pages/api/hello';

const DynamicComponent = dynamic(() => import('./DynamicComponent'));

function NextApp() {
  return (
    <div className={styles.container}>
      {/* Next.js Link */}
      <Link href="/about">
        <a>About</a>
      </Link>

      {/* Next.js Image */}
      <Image
        src="/public/logo.png"
        alt="Logo"
        width={200}
        height={100}
      />

      {/* Dynamic Import */}
      <DynamicComponent />

      {/* API Route */}
      <button onClick={() => api()}>Call API</button>

      {/* CSS Module */}
      <div className={styles.content}>
        <p>Styled content</p>
      </div>

      {/* Public Asset */}
      <img src="/images/hero.jpg" alt="Hero" />
    </div>
  );
}

export default NextApp;
