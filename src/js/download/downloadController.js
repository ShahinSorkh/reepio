import { util } from 'peerjs'
/**
 * Copyright (C) 2014 reep.io
 * KodeKraftwerk (https://github.com/KodeKraftwerk/)
 *
 * reep.io source - In-browser peer-to-peer file transfer and streaming
 * made easy
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
(function () {
  'use strict'

  angular.module('download')
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider.when('/d/:id', {
        templateUrl: 'html/download/download.html',
        controller: 'DownloadCtrl'
      })
    }])
    .controller('DownloadCtrl', ['$scope', '$rootScope', '$route', '$timeout', '$location', '$analytics', '$crypto', 'config', 'downloadService', 'detectCrawlerService',
      function ($scope, $rootScope, $route, $timeout, $location, $analytics, $crypto, config, downloadService, detectCrawlerService) {
        if (typeof $rootScope.downloadId === 'undefined') {
          $rootScope.downloadId = $route.current.params.id
          $rootScope.cryptoDownloadId = $crypto.crc32($route.current.params.id)
          $rootScope.downloadService = downloadService
        }

        // dismiss key
        $analytics.pageTrack('/d/' + $rootScope.cryptoDownloadId)

        if (!detectCrawlerService.isCrawler(navigator.userAgent) && !util.supports.data) {
          $location.path('incompatible')
          return
        }

        $scope.isImage = false

        if ($rootScope.downloadId.length === (config.peerIdLength + config.fileIdLength)) {
          downloadService.requestFileInformation($rootScope.downloadId)
        } else {
          $rootScope.downloadId = null
          $rootScope.cryptoDownloadId = null
          $scope.downloadError = 'Invalid Download'
          $scope.downloadErrorDescription = 'The download link you are using is invalid.'
        }

        $scope.downloadFile = function () {
          //                    $scope.isStreamingRunning = false;

          downloadService.startDownload()
        }

        $scope.startStream = function () {
          //                    $scope.isStreamingRunning = false;

          downloadService.startStream()
        }

        $scope.getIsDownloadVisible = function () {
          return !$scope.downloadError && ['ready', 'inprogress', 'paused', 'finished', 'datachannelClosed'].indexOf($rootScope.downloadService.downloadState) !== -1
        }

        $scope.saveFile = function () {
          $timeout(function () {
            $('#download-frame').get(0).click()
          })
        }

        $scope.doAuthentication = function () {
          downloadService.doAuthentication($scope.password)
        }

        var rootscopeEvents = [
          $rootScope.$on('DownloadFinished', function (e) {
            $timeout(function () {
              $scope.$apply(function () {
                if ($scope.isImage) {
                  // TODO ??
                } else {
                  var downloadFrame = $('#download-frame')
                  if (downloadFrame.length > 0) {
                    downloadFrame.get(0).click()
                  }
                }
              })
            })

            $analytics.eventTrack('startDownload', { category: 'download', value: Math.round(downloadService.file.size / 1024) })
          }),
          $rootScope.$on('FileInformation', function (event, data) {
            $timeout(function () {
              $scope.$apply()
            })
          }),
          $rootScope.$on('intervalCalculations', function (event) {
            $timeout(function () {
              $scope.$apply()
            })
          }),
          $rootScope.$on('AuthenticationRequest', function (event) {
            $timeout(function () {
              $scope.$apply()
            })
          }),
          $rootScope.$on('IncorrectPassword', function (event) {
            $timeout(function () {
              $scope.$apply(function () {
                $scope.authenticationError = 'Invalid credentials. Please enter the correct password'
              })
            })
          }),
          $rootScope.$on('DownloadDataChannelClose', function () {
            if ($rootScope.downloadService.downloadState !== 'finished' && $scope.isStreamingRunning === false) {
              $timeout(function () {
                $scope.$apply(function () {
                  $scope.downloadError = 'The uploader has closed the connection'
                  $scope.downloadErrorDescription = 'You cannot download this file anymore because the connection to the uploader is closed.'
                })
              })
            }
          }),
          $rootScope.$on('NoFileSystem', function () {
            $timeout(function () {
              $scope.$apply()
            })
          })
        ]

        // remove rootscope events
        $scope.$on('$destroy', function () {
          angular.forEach(rootscopeEvents, function (offDelegate) {
            offDelegate()
          })
        })
      }])
})()
