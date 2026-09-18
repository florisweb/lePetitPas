
import gulp from 'gulp';
import concat from 'gulp-concat';

import webpack_stream from 'webpack-stream';
import webpack from 'webpack';
import WPConfig from './webpack.config.js';


function watch() {
  gulp.watch('src/**/*', compile); 
}

async function main() {
  return gulp.src(["src/index.html"])
    .pipe(gulp.dest("dist"));
}
async function images() {
  return gulp.src(['src/images/*'])
    .pipe(gulp.dest("dist/images"));
}
async function manifest() {
  return gulp.src(['src/manifest.json'])
    .pipe(gulp.dest("dist"));
}


async function javascript() {
  return webpack_stream(WPConfig, webpack)
        .pipe(gulp.dest(`dist`));
}

function css() {
  return gulp.src("src/css/**/*.css")
    .pipe(concat('main_min.css'))
    .pipe(gulp.dest("dist"));
}

let compile = gulp.series(main, javascript, css, images, manifest);
export default gulp.series(compile, watch);


