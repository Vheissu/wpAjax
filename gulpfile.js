var gulp     = require('gulp'),
     plugins = require('gulp-load-plugins')({camelize: true});

// Lets us type "gulp" on the command line and run all of our tasks
gulp.task('default', ['jshint', 'vendor', 'scripts']);

// Hint all user-developed JS
gulp.task('jshint', function() {
  return gulp.src(['js/*.js', '!js/theme.min.js', '!js/vendor.min.js'])
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    .pipe(plugins.notify({ message: 'JS Hinting task complete' }));
});

// Combine, minify all vendor JS
gulp.task('vendor', function() {
  return gulp.src(['js/vendor/*.js'])
    .pipe(plugins.concat('vendor.min.js'))
    .pipe(plugins.uglify())
    .pipe(gulp.dest('js/'))
    .pipe(plugins.notify({ message: 'Vendor JS task complete' }));
});

// JS concat, strip debugging and minify
gulp.task('scripts', function() {
  return gulp.src(['js/*.js', '!js/theme.min.js', '!js/vendor.min.js', '!js/vendor{,/**}'])
    .pipe(plugins.concat('theme.min.js'))
    .pipe(plugins.stripDebug())
    .pipe(plugins.uglify())
    .pipe(gulp.dest('js/'))
    .pipe(plugins.notify({ message: 'Scripts task complete' }));
});
