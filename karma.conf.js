module.exports = function (config) {
  config.set({

    basePath: './',

    files: [
      'public/app/app.bundle.js',
      'node_modules/angular-mocks/angular-mocks.js',
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
