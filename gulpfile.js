/*
 * Gulp4 Frontend Starterkit
 */

var gulp = require('gulp');
var sass = require('gulp-sass');
var htmlPartial = require('gulp-html-partial');
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var cssnano = require("cssnano");
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var fs = require("fs");
var del = require('del');
var browserSync = require('browser-sync');

var paths = {
  templates: {
    src: 'src/templates/',
    dest: 'dist'
  },
  styles: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css'
  },
  scripts: {
    src: 'src/scripts/*.js',
    vendors: 'src/scripts/vendors/*.js',
    dest: 'dist/scripts/'
  }
};

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var server = browserSync.create()

// SERVE
function serve(done) {
  server.init({
    server: {
      baseDir: './dist'
    }
  });
  done();
}

// RELOAD
function reload(done) {
  server.reload();
  done();
}

// STYLE
function style() {
  return (
    gulp
      .src(paths.styles.src)
    		.pipe(sourcemaps.init())
    		.pipe(sass({
    			functions: {
    				'svg_color': svgColor
    			}
    		}).on('error', sass.logError))
        .pipe(postcss([autoprefixer(), cssnano()]))
    		.pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.styles.dest))
  );
}

exports.style = style;

// SCRIPTS
function scripts() {
  return (
    gulp.src([
        paths.scripts.vendors,
        paths.scripts.src,
      ])
  		.pipe(concat('scripts.js'))
  		.pipe(uglify())
      .pipe(rename({
          suffix: '.min'
      }))
  		.pipe(gulp.dest(paths.scripts.dest))
  );
}

exports.scripts = scripts;

// HTML
function html() {
  return (
    gulp.src([paths.templates.src + '*.html'])
      .pipe(htmlPartial({
          basePath: paths.templates.src + '/partials/'
      }))
      .pipe(gulp.dest('./dist'))
  );
}

exports.html = html;

// CLEAN
function clean() {
  return del(['dist']);
}

exports.clean = clean;

// WATCH
function watch() {
    gulp.watch(paths.templates.src + '**/*.html', gulp.series(html, reload));
    gulp.watch(paths.styles.src, gulp.series(style, reload));
    gulp.watch(paths.scripts.src, gulp.series(scripts, reload));
}

exports.watch = watch;

/*
 *	@param  svgPath     String		|	Path to svg file
 *	@param	color		SassColour	|	Colour in the form of a Sass object
 */
function svgColor(svgPath, color) {

  // Find the SVG file
  if (fs.existsSync(svgPath.getValue())) {

    //read the contents of the file
    var contents = fs.readFileSync(svgPath.getValue(), {encoding: 'utf8'});

    // console.log("Contents: %O", contents);

    var regex = /fill=\"([^\"])*\"/;

    var colourAsHex = "";

    function addMissingZero(hexString) {
      if (hexString.length == 1) hexString = "0" + hexString;

      return hexString;
    }

    colourAsHex = addMissingZero(color.getR().toString(16));
    colourAsHex = colourAsHex + addMissingZero(color.getG().toString(16));
    colourAsHex = colourAsHex + addMissingZero(color.getB().toString(16));


    var svgElementCode = contents.replace(regex, 'fill="rgb(' + color.getR() + ',' + color.getG() + ',' + color.getB() + ')"');

    // console.log("SVG element code: " + svgElementCode);

    var nodeSassString = nodeSass.types.String;

    var encodedSVG = new nodeSassString();
    encodedSVG.setValue("url('data:image/svg+xml;charset=utf-8," + svgElementCode + "')");

    // console.log("Encoded SVG: %O", encodedSVG.getValue());

    return encodedSVG;

  }
  else {
    throw new Error("File not found...");
  }

}

var production = gulp.series(clean, style, scripts, html);
exports.build = production;

var development = gulp.series(serve, watch);
exports.default = development;
