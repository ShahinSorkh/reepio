/**
 * Created by andre (http://korve.github.io/) on 06.12.2014
 */

angular.module('reepioClipboardDirective', [])
	.service('clipboardDirectiveIdService', [function () {
		return {
			__id: 0,
			getUniqueId: function () {
				return 'clipboard-' + (this.__id++);
			}
		};
	}])
	.directive('reepioClipboard', ['$compile', 'clipboardDirectiveIdService', 'converterService', 'clipboardSwf', 'clipboardExpressInstallSwf',
		function ($compile, clipboardDirectiveIdService, converterService, clipboardSwf, clipboardExpressInstallSwf) {

		var params = {
			menu: "false",
			allowFullscreen: "false",
			allowScriptAccess: "always",
			bgcolor: "",
			wmode: "transparent"
		};

		// gets called by flash ExternalInterface
		window.clipboard = {
			ready: false,
			loaded: function(id) {
				window.clipboard.ready = true;
				var el = angular.element('#' + id),
					scope = el.scope();

				el.get(0).setClipboardData(scope.data);
			},
			copied: function(id) {
				var el = angular.element('#' + id),
					scope = el.scope();

				if(scope.onCopied)
					scope.onCopied(el.parents('.btn-clipboard'));
			}
		};

		return {
			restrict: 'EA',
			transclude: true,
			scope: {
				data: '=clipboardData',
				onCopied: '=?'
			},
			template: '<div class="btn-clipboard"><span ng-transclude></span></div>',
			link: function (scope, element, attrs) {
				scope.id = clipboardDirectiveIdService.getUniqueId();

				// append swf container
				var swfContainer = '<div id="' + scope.id + '"></div>';
				var html = $compile(swfContainer)(scope);
				element.find('.btn-clipboard').prepend(html);

				if( typeof swfobject === 'undefined')
					throw new Error("swfobject is required");

				var flashObj, bgColor, flashvars, attributes;

				flashvars = {
					data: scope.data,
					// bgcolor: '0x' + converterService.rgb2hex(bgColor),
					id: scope.id
				};

				attributes = {
					id: scope.id
				};

				swfobject.embedSWF(
					clipboardSwf,
					scope.id, "100%", "100%", "10.0.0",
					clipboardExpressInstallSwf,
					flashvars, params, attributes, function(e) {
						if( ! e.success)
						{
							element.remove();
							throw new Error("Could not initialize " + clipboardSwf);
						}

						flashObj = document.getElementById(e.id);
					});

				scope.$watch('data', function (newValue) {
					if(typeof newValue !== 'undefined' && element.setClipboardData)
						element.setClipboardData(newValue);
				});

				// check if flash plugin has been blocked
				setTimeout(function () {
					if(window.clipboard.ready)
						return;

					element.remove();
					flashObj.remove();
				}, 300);
			}
		}
	}]);