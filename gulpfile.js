// Initialize modules

// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series } = require('gulp');

// Importing all other necessary modules
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const babel = require('gulp-babel');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const browsersync = require('browser-sync').create();


// File paths

const files = {
    
    html : {
        src : "./**/*.html",
		list: ["./**/*.html"],
		dest: "."
    },

    style: {
        src :  "app/scss/**/*.scss",
        main :  "app/scss/style.scss", // Main file in folder
        dest: "dist/css/"
    },

    js: {
        src: "app/js/**/*.js",
        main:  "app/js/script.js", // Main file in folder
        dest: "dist/js/"
    }
};


// Sass task compiles the style.scss file into style.min.css
function scssTask() {
	return src(files.style.main, { sourcemaps: true}, {allowEmpty: true}) // set source and activate sourcemaps
		.pipe(sass()) // compile SCSS to CSS and send out a compressed output
		.pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins, prefix and minify css
		.pipe(rename( { suffix : '.min' } )) // Rename file
		.pipe(dest(files.style.dest, { sourcemaps: '.' })); // put final CSS in dist folder with sourcemap
}

// JS task to uglifies JS files to script.min.js
function jsTask() {
	return src(files.js.main, {sourcemaps: true}, {allowEmpty: true}) // set source and activate sourcemaps
		.pipe(babel( { presets: ['@babel/preset-env'] })) // Compile ES6 js to older js for browser compatibility
		.pipe(terser()) // Minify javascript
		.pipe(rename( { suffix : '.min' } )) // Rename file
		.pipe(dest(files.js.dest, { sourcemaps: '.' })); // put final CSS in dist folder with sourcemap
}


// Browsersync to spin up a local server
function browserSyncServe(cb) {
	// initializes browsersync server
	browsersync.init({
		open: false,
        injectChanges: true,
		server: {
			baseDir: './',
		},
		notify: {
			styles: {
				top: 'auto',
				bottom: '0',
			},
		},
	});
	cb();
}


function browserSyncReload(cb) {
	// reloads browsersync server
	browsersync.reload();
	cb();
}


// Watch task without active browser sync
function watchTask() {
	watch(
		[files.style.src, files.js.src],
		{ interval: 1000, usePolling: true }, 
		series(scssTask, jsTask)
	);
}

// Watch task while browser sync is active
function bsWatchTask() {
	watch(files.html.src, browserSyncReload);
	watch(
		[files.style.src, files.js.src],
		{ interval: 1000, usePolling: true },
		series(scssTask, jsTask, browserSyncReload)
	);
}


exports.default = series(scssTask, jsTask, watchTask); // gulp command

exports.sync = series(scssTask, jsTask, browserSyncServe, bsWatchTask); // gulp sync command