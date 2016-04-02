# gulp-ng2-relative-path

Use relative paths within Angular2 components for `templateUrl` and `styleUrls`.

This package is based on the work of [gulp-inline-ng2-template](https://github.com/ludohenin/gulp-inline-ng2-template).

# Installation

```bash
npm install gulp-ng2-relative-path --save-dev
```

# Configurations

```js
var defaults = {
  base: './',                   // Source base folder
  appBase: '/',                 // Angular app base folder
  templateExtension: '.html',   // Template file extension
  modifyPath: false             // Function to additionally modify file paths
};
```

# Example Usage

```js
var ng2RelativePath = require('gulp-ng2-relative-path');

var result = gulp.src('./src/ts/**/*.ts')
  .pipe(ng2RelativePath({
    base: './src/ts',
    appBase: '/app',
    modifyPath: function (path) {
      return path.replace('.less', '.css');
    }
  }))
  .pipe(tsc());

return result.js
  .pipe(gulp.dest('./dist/app'));
```
