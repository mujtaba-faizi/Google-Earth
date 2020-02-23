const gulp = require('gulp');
const less = require('gulp-less');
const watch = require('gulp-watch');
const batch = require('gulp-batch');
const plumber = require('gulp-plumber');
const jetpack = require('fs-jetpack');

const srcDir = jetpack.cwd('./src/stylesheets');
const destDir = jetpack.cwd('./app');

gulp.task('less', () => {
  return gulp.src(srcDir.path('*.less'))
  .pipe(plumber())
  .pipe(less())
  .pipe(gulp.dest(destDir.path('stylesheets')));
});

gulp.task('watch', () => {
  const beepOnError = (done) => {
    return (err) => {
      if (err) {
        utils.beepSound();
      }
      done(err);
    };
  };

  watch('src/stylesheets/*.less', batch((events, done) => {
    gulp.start('less', beepOnError(done));
  }));

});

gulp.task('build', ['less']);
