// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const browsersync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');

// File paths

const files = {
    html : {
        src : "./**/*.html",
		list: ["./**/*.html"],
		dest: "."
    },

    style: {
        src :  "app/scss/**/*.scss",
        dest: "dist/css/"
    },

    js: {
        src: "app/js/**/*.js",
        dest: "dist/js/"
    }
};


// Sass task: compiles the style.scss file into style.css
function scssTask() {
	return src(files.style.src) // set source
		.pipe(sourcemaps.init()) // Initialize sourcemap
		.pipe(sass()) // compile SCSS to CSS and send out a compressed output
		.pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
		.pipe(rename( { suffix : '.min' } ))
		.pipe(sourcemaps.write('./'))
		.pipe(dest(files.style.dest)); // put final CSS in dist folder with sourcemap
}

// JS task: concatenates and uglifies JS files to script.js
function jsTask() {
	return src(
		[
			files.js.src,
			//,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
		],
	)
		.pipe(sourcemaps.init()) // Initialize sourcemap
		.pipe(concat('all.js'))
		.pipe(terser())
		.pipe(rename( { suffix : '.min' } ))
		.pipe(sourcemaps.write('./'))
		.pipe(dest(files.js.dest));
}

// Cachebust
function cacheBustTask() {
	var cbString = new Date().getTime();
	return src(files.html.list)
		.pipe(replace(/cb=\d+/g, 'cb=' + cbString))
		.pipe(dest(files.html.dest));
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

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask() {
	watch(
		[files.style.src, files.js.src],
		{ interval: 1000, usePolling: true }, //Makes docker work
		series(parallel(scssTask, jsTask), cacheBustTask)
	);
}

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
function bsWatchTask() {
	watch(files.html.src, browserSyncReload);
	watch(
		[files.style.src, files.js.src],
		{ interval: 1000, usePolling: true }, //Makes docker work
		series(parallel(scssTask, jsTask), cacheBustTask, browserSyncReload)
	);
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(parallel(scssTask, jsTask), cacheBustTask, watchTask);

// Runs all of the above but also spins up a local Browsersync server
// Run by typing in "gulp bs" on the command line
exports.bs = series(
	parallel(scssTask, jsTask),
	cacheBustTask,
	browserSyncServe,
	bsWatchTask,
);
