const { ESLint } = require('eslint');
const path = require('path');

async function main() {
  const eslint = new ESLint({
    fix: true,
    useEslintrc: true,
  });

  try {
    // Run ESLint on all TypeScript and JavaScript files in the app directory
    const results = await eslint.lintFiles([
      './app/**/*.{ts,tsx,js,jsx}',
      './components/**/*.{ts,tsx,js,jsx}',
      './lib/**/*.{ts,tsx,js,jsx}'
    ]);

    // Apply automatic fixes
    await ESLint.outputFixes(results);

    // Format the results
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = await formatter.format(results);

    // Log the results
    console.log(resultText);

    // Check if there are any errors
    const errorCount = results.reduce((count, result) => count + result.errorCount, 0);
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error running ESLint:', error);
    process.exit(1);
  }
}

main(); 