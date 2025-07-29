import gulp from 'gulp';
import uglify from 'gulp-uglify'
import cleanCSS from 'gulp-clean-css'
import htmlmin from 'gulp-htmlmin'
import fs from 'fs-extra';


function scripts() {
  return gulp.src(['js/*.js'])
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
}

function indexHtml() {
  return gulp
    .src("./popup.html")
    .pipe(
      htmlmin({
        removeComments: true,
        collapseWhitespace: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
      })
    )
    .pipe(gulp.dest("./dist"));
}

function indexJson() {
  return gulp.src("./manifest.json").pipe(gulp.dest("./dist"));
}

function indexOther() {
  const arr = ["./background.js", "./content.js"]
  return gulp.src(arr).pipe(uglify()).pipe(gulp.dest("./dist"));
}


function styles() {
  return gulp.src('css/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/css'));
}

function copyIcons() {
  return fs.copy('icons', 'dist/icons', {
    overwrite: true,
    preserveTimestamps: true,
  })
    .then(() => console.log('✅ Icons copied successfully!'))
    .catch(err => console.error('❌ Copy failed:', err));
}


function clean() {
  return fs.remove('dist');
}


const build = gulp.series(clean, copyIcons, gulp.parallel(scripts, styles, indexHtml, indexJson, indexOther));


export default build;