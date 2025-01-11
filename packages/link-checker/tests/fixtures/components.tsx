import React from 'react';
import ValidComponent from './ValidComponent';
import MissingComponent from './MissingComponent';
import { Button } from '@ui-library';
import { MissingButton } from '@missing-library';

function App() {
  return (
    <div>
      <ValidComponent />
      <MissingComponent />
      <Button />
      <MissingButton />
    </div>
  );
}

export default App;
