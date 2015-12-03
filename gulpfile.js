'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var _ = require('lodash');
var wrench = require('wrench');

var options = {
	src: 'src',
	dist: 'dist',
	tmp: '.tmp',
	errorHandler: function(title) {
		return function(err) {
			gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
			this.emit('end');
		};
	}
};

wrench.readdirSyncRecursive('./gulp').filter(function(file) {
	return (/\.(js|coffee)$/i).test(file);
}).map(function(file) {
	if(file.match(/templates\\/g)) return;
	console.log(file)
	var tmpFunc = require('./gulp/' + file);
	if(tmpFunc){
		tmpFunc(options);
	}
});

gulp.task('default', ['clean'], function () {
	gulp.start('serve');
});
