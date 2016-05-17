const gulp = require('gulp');
const babel = require('gulp-babel');
const esdoc = require('gulp-esdoc');
const replace = require('gulp-replace');
const deploy = require('gulp-gh-pages');
const packagejson = require('./package.json');

gulp.task('build', () => {
  return gulp.src('src/*.js')
    .pipe(replace('LIBHONEY_JS_VERSION', packagejson.version))
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('lib'));
});

gulp.task('docs', () => {
  return gulp.src("./src")
    .pipe(esdoc({ destination: "./docs",
                  test: {
                    type: "mocha",
                    source: "./test"
                  }
                }));
});

gulp.task('deploy-docs', function () {
  return gulp.src("./docs/**/*")
    .pipe(deploy())
});

gulp.task('default', [ 'build', 'docs' ]);
