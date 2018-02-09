import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import commonjs from 'rollup-plugin-commonjs';

const env = process.env.NODE_ENV;
const config = {
  input: 'src/index.js',
  external: [
    'react',
  ],
  globals: {
    react: 'React',
  },
  plugins: [
    eslint({
      throwOnError: true,
      exclude: 'node_modules/**',
    }),
    resolve({
      jsnext: true,
    }),
    babel({
      plugins: ['external-helpers'],
      exclude: 'node_modules/**',
    }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
};
if (env === 'examples') {
  config.output = { format: 'cjs' };
  config.external.push('react-dom', 'enzyme', 'jsdom');
} else if (env === 'es' || env === 'cjs') {
  config.output = { format: env };
} else {
  config.output = {
    file: '.bundle.js',
    format: 'umd',
    name: 'myBundle',
  };
}

export default config;
