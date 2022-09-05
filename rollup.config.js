'use strict';

var path = require('path');
var tsc = require('rollup-plugin-typescript2');
var dts = require('rollup-plugin-dts').default;
var rollup = require('rollup');

var cwd = path.join(__dirname);
var shared = {
    external: /^copy-anything$/,
    input: {
        index: path.join(__dirname, 'src', 'index.ts')
    },
    plugins: [
        tsc({
            cwd: cwd,
            tsconfig: path.join(cwd, 'tsconfig.json'),
            check: true,
            clean: true
        })
    ]
};
var outDir = path.join(__dirname, 'dist');
var outDirES2015 = path.join(__dirname, 'dist', 'es2015');

var es5Settings = Object.assign({}, shared, {
    output: [
        {
            dir: outDir,
            format: 'esm',
            entryFileNames: '[name].mjs',
            chunkFileNames: '[name].mjs',
            hoistTransitiveImports: false,
            sourcemap: true
        },
        {
            dir: outDir,
            format: 'cjs',
            entryFileNames: '[name].cjs',
            chunkFileNames: '[name].cjs',
            hoistTransitiveImports: false,
            sourcemap: true,
            exports: 'auto'
        },
        {
            dir: outDir,
            format: 'esm',
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            hoistTransitiveImports: false,
            sourcemap: true
        }
    ]
});

var es2015Settings = Object.assign({}, shared, {
    plugins: [
        tsc({
            cwd: cwd,
            tsconfig: path.join(cwd, 'tsconfig.es2015.json'),
            check: true,
            clean: true,
        })
    ],
    output: es5Settings.output.map(function mapper(conf) {
        var shallow = Object.assign({}, conf);
        shallow.dir = outDirES2015;
        return shallow;
    })
})

module.exports = rollup.defineConfig([
    es5Settings,
    es2015Settings,
    {
        input: {
            index: path.join(cwd, 'typings', 'index.d.ts')
        },
        plugins: [
			dts({
				compilerOptions: {
					module: 99,
					moduleResolution: 99,
					esModuleInterop: true,
					allowSyntheticDefaultImports: true,
					lib: ['dom', 'esnext']
				}
			})
		],
        output: [
            {
                dir: outDir,
                format: 'esm',
                entryFileNames: '[name].d.ts',
                chunkFileNames: '[name].d.ts'
            },
            {
                dir: outDirES2015,
                format: 'esm',
                entryFileNames: '[name].d.ts',
                chunkFileNames: '[name].d.ts'
            },
        ]
    }
]);
