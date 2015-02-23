var gulp = require('gulp');
var babel = require('gulp-babel');
var rename = require('gulp-rename');

var paths = {
  scripts : ['src/scripts/*.js']
};

gulp.task('scripts', function () {
  return gulp.src('src/scripts/*.js')
    .pipe(babel())
    .pipe(rename({suffix: '_babelled'}))
    .pipe(gulp.dest('dest/scripts'));
});

gulp.task('watch', function () {
  gulp.watch(paths.scripts, ['scripts']);
});
