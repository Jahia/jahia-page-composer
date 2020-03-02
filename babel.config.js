// Const presets = [
//     [
//         '@babel/env',
//         {
//             targets: {
//                 browsers: ['last 2 versions', '> 5%']
//             },
//             modules: process.env.BABEL_MODULES ?
//                 process.env.BABEL_MODULES :
//                 'commonjs' // Babel's default is commonjs
//         }
//     ]
// ];

module.exports = {
    sourceMaps: 'inline',
    presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript'
    ],
    plugins: [
        '@babel/plugin-transform-classes',
        '@babel/plugin-proposal-class-properties',
        ['@babel/plugin-transform-runtime', {regenerator: true}]
    ]
};
