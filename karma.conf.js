module.exports = function (config) {
  config.set({

    basePath: './',

    files: [
      'public/assets/js/jquery-1.11.1.js',
      'public/assets/js/angular-1.2.21/angular.js',
      'public/assets/js/angular-1.2.21/angular-route.js',
      'public/assets/js/angular-1.2.21/angular-animate.js',
      'public/assets/js/angular-1.2.21/angular-mocks.js',
      'public/assets/js/angulartics-0.16.1/src/angulartics.js',
      'public/assets/js/angulartics-0.16.1/src/angulartics-piwik.js',
      'public/assets/js/*.js',
      'public/assets/js/ui-bootstrap-0.11.0.js',
      'public/modules/**/module.js',
      'public/modules/**/*.js',
      'public/config.js',
      'public/app.js',
      'tests/**/*_test.js'
    ],

    autoWatch: true,
    singleRun: true,

    frameworks: ['jasmine'],

    browsers: ['Chrome', 'Firefox'],

    plugins: [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-jasmine',
      'karma-junit-reporter'
    ],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  })
}
