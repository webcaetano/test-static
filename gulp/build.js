'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var exec = require('sync-exec');

var $ = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

function checkModuleExist(module){
	try {
		require.resolve(module);
	} catch(e) {
		return false;
	}
	return true;
}

module.exports = function(options) {
	gulp.task('html', ['inject'], function () {
		var assets;
		return gulp.src(options.tmp + '/serve/*.html')
			.pipe(assets = $.useref.assets())
			.pipe($.rev())
			// .pipe($.if('*.js', $.ngAnnotate()))
			.pipe($.if('*.js', $.uglify()))
			// .pipe($.replace('../../bower_components/font-awesome-less/fonts/', '../fonts/'))
			.pipe($.if('*.css', $.csso()))
			.pipe(assets.restore())
			.pipe($.useref())
			.pipe($.revReplace())
			// .pipe($.if('*.html', $.minifyHtml({empty: true,	spare: true, quotes: true, conditionals: true})))
			.pipe(gulp.dest(options.dist + '/'))
			.pipe($.size({ title: options.dist + '/', showFiles: true }));
	});

	// Only applies for fonts from bower dependencies
	// Custom fonts are handled by the "other" task
	gulp.task('fonts', function () {
		return gulp.src($.mainBowerFiles())
			.pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
			.pipe($.flatten())
			.pipe(gulp.dest(options.dist + '/fonts/'));
	});

	gulp.task('other', function () {
		return gulp.src([
			options.src + '/**/*',
			'!' + options.src + '/**/*.{css,js,less}'
		])
		.pipe(gulp.dest(options.dist + '/'));
	});

	gulp.task('rest', function (done) {
		$.del([
			options.dist + '/app',
			options.dist + '/sass',
		], done);
	});

	gulp.task('clean', function (done) {
		$.del([options.dist + '/', options.tmp + '/'], done);
	});

	gulp.task('build',function(done){
		runSequence('clean',['html', 'fonts', 'other'],'rest',done);
	});

	var ghPages = require('gulp-gh-pages');

	gulp.task('gh-pages', ['build'], function() {
		return gulp.src('dist/**/*')
		.pipe(ghPages())
		.pipe($.clean());
	});

	gulp.task('travisDeploy', function(done){
		var r = [
			'git config --global user.email "nobody@nobody.org"',
			'git config --global user.name "Travis CI"'
		]
		if(!checkModuleExist('bower')) r.push('npm install bower; bower install');

		console.log(exec(r.join("; ")));
		runSequence('build',function(){
			console.log(exec([
				'cd dist',
				'git init',
				'git add .',
				'git commit -m "Deploy to Github Pages"',
				'git push --force --quiet "https://${GITHUB_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1'
			].join("; ")));
			done();
		})
	});
};
