'use strict';

import 'jquery';
import 'angular';
import 'angular-route';
import 'angular-animate';
import 'angular-ui-bootstrap';
import 'angulartics';
import 'angulartics-piwik';
import 'swfobject';
import './common/filters/fileFilters.js';
import './common/filters/stringFilters.js';
import './common/directives/fileIcon.js';
import './common/directives/progressBar.js';
import './common/module.js';
import './common/crypto.js';
import './common/notifications.js';
import './common/randomService.js';
import './common/detectCrawlerService.js';
import './common/dialog.js';
import './common/loading.js';
import './common/converterService.js';
import './clipboard/module.js';
import './clipboard/clipboardDirective.js';
import './peering/peeringService.js';
import './download/module.js';
import './download/downloadController.js';
import './download/downloadService.js';
import './download/loadingIndicatorDirective.js';
import './download/storageService.js';
import './upload/module.js';
import './upload/uploadController.js';
import './upload/uploadService.js';
import './upload/dropZoneDirective.js';
import './static/module.js';
import './static/static.js';
import './static/slidingFileDirective.js';
import './title/title.js';

var use = [
	'ngAnimate',
	'ngRoute',
	'upload',
	'static',
	'download',
	'titleController',
	'common',
	'angulartics',
	'angulartics.piwik'
];

angular.module('peertome', use, ['$compileProvider', function ($compileProvider) {
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|filesystem|blob):/);
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|filesystem|blob):|data:image\//);
}])
	// generated while bundling
	.constant('appEnv', APP_ENV)

	// generated while bundling
	.constant('config', APP_CONFIG)

	.config(['$routeProvider', '$locationProvider', '$analyticsProvider', 'appEnv', function ($routeProvider, $locationProvider, $analyticsProvider, appEnv) {
		$routeProvider
			.otherwise({
				templateUrl: 'html/static/page-404.html',
				controller: 'StaticCtrl'
			});

		$locationProvider.html5Mode(true);
		$analyticsProvider.virtualPageviews(false);
	}])
	.value('clipboardSwf', '/bower_components/reepio-paste-to-clipboard/bin/CopyToClipboard.swf')
	.value('clipboardExpressInstallSwf', '/bower_components/reepio-paste-to-clipboard/bin/expressInstall.swf')
	.run(['$rootScope', '$location', '$route', '$document', 'appEnv',
	function ($rootScope, $location, $route, $document, appEnv) {
		$rootScope.appEnv = appEnv;

		// init heise social share privacy plugin.
		var el = document.getElementById('socialshareprivacy');
		if(el){
			el.socialSharePrivacy({
				services : {
					facebook : {
						'perma_option' : 'off',
						'dummy_img' : 'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/dummy_facebook_en.png',
						'img' : 'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/facebook.png',
						'sharer': {
							'status': 	'on',
							'dummy_img':'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/dummy_facebook_share_en.png',
							'img' : 	'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/facebook_share_en.png'
						}
					},
					twitter : {
						'perma_option' : 'off',
						'dummy_img' : 'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/dummy_twitter.png',
						'img' : 'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/twitter.png'
					},
					gplus : {
						'perma_option' : 'off',
						'dummy_img' : 'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/dummy_gplus.png',
						'img' : 'bower_components/jquery.socialshareprivacy/socialshareprivacy/images/gplus.png'
					}
				},
				'css_path'  : '',
				'lang_path' : 'bower_components/jquery.socialshareprivacy/lang/',
				'language'  : 'en',
				'uri'		: 'https://reep.io',
				'perma_orientation' : 'top'
			});
		}

		$rootScope.getIsPageActive = function (page) {
			if(page === '/d')
				return $location.path() === (page + '/' + $rootScope.downloadId);

			return $location.path() === page;
		};

		$rootScope.running = true;
		$rootScope.copyrightYear = (new Date()).getFullYear();
}]);
