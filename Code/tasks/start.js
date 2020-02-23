const gulp = require('gulp');
const webserver = require('gulp-webserver');

gulp.task('start', ['build', 'watch'], () => {
  gulp.src('app')
      .pipe(webserver({
        livereload: false,
        directoryListing: false,
        open: "index.html",
        fallback: 'index.html'
  }));
});
