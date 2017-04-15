import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import del from 'del';
import runSequence from 'run-sequence';

const plugins = gulpLoadPlugins();

const paths = {
  js: ['./server/**/*.js', './config/**/*.js', './index.js', '!dist/**', '!node_modules/**', '!coverage/**'],
  nonJs: ['./package.json', './.gitignore', './.babelrc'],
  views: ['./server/views/**/*.twig'],
  plugins: ['./server/plugins/**/*.json', './server/plugins/**/*.html', './server/plugins/**/*.css'],
  configs: ['./config/*.json'],
  tests: './server/tests/*.js'
};

// Clean up dist and coverage directory
gulp.task('clean', () =>
  del(['dist/**', 'coverage/**', '!dist', '!coverage'])
);

// Copy non-js files to dist
gulp.task('copy', ['copyViews', 'copyConfig', 'copyPlugins'], () =>
  gulp.src(paths.nonJs)
    .pipe(plugins.newer('dist'))
    .pipe(gulp.dest('dist'))
);

gulp.task('copyViews', () =>
  gulp.src(paths.views)
    // .pipe(plugins.newer('dist/server/views'))
    .pipe(gulp.dest('dist/server/views'))
);

gulp.task('copyPlugins', () =>
  gulp.src(paths.plugins)
    // .pipe(plugins.newer('dist/server/views'))
    .pipe(gulp.dest('dist/server/plugins'))
);

gulp.task('copyConfig', () =>
  gulp.src(paths.configs)
    // .pipe(plugins.newer('dist/server/views'))
    .pipe(gulp.dest('dist/config'))
);

// Compile ES6 to ES5 and copy to dist
gulp.task('babel', () =>
  gulp.src([...paths.js, '!gulpfile.babel.js'], { base: '.' })
    .pipe(plugins.newer('dist'))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel())
    .pipe(plugins.sourcemaps.write('.', {
      includeContent: false,
      sourceRoot(file) {
        return path.relative(file.path, __dirname);
      }
    }))
    .pipe(gulp.dest('dist'))
);

// Start server with restart on file changes
gulp.task('nodemon', ['copy', 'babel'], () =>
  plugins.nodemon({
    script: path.join('dist', 'index.js'),
    ext: 'js',
    ignore: ['node_modules/**/*.js', 'dist/**/*.js'],
    tasks: ['copy', 'babel']
  })
);

// gulp serve for development
gulp.task('serve', ['clean'], () => runSequence('nodemon'));

// default task: clean dist, compile js files and copy non-js files.
gulp.task('default', ['clean'], () => {
  runSequence(
    ['copy', 'babel']
  );
});
