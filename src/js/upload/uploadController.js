/* globals $, angular, util */
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

  angular.module('upload')
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: 'html/upload/upload.html',
        controller: 'UploadCtrl'
      })
    }])
    .controller('UploadCtrl', ['$scope', '$location', '$timeout', '$document', '$analytics', 'uploadService', '$rootScope', 'detectCrawlerService', '$crypto', '$log', '$uibModal',
      function ($scope, $location, $timeout, $document, $analytics, uploadService, $rootScope, detectCrawlerService, $crypto, $log, $uibModal) {
        $analytics.pageTrack($location.path())

        // Show the incompatible site only to real users
        if (!detectCrawlerService.isCrawler(navigator.userAgent) && !util.supports.data) {
          $location.path('incompatible')
          return
        }

        if ($rootScope.fileModel === undefined) {
          $rootScope.fileModel = {}
          $rootScope.fileModel.files = []
        }

        var $initializing = true
        $scope.isClipboardSupported = typeof document.execCommand !== 'undefined'

        $scope.$watchCollection('fileModel.files', function (newValue, oldValue) {
          // wait for next digest cycle
          if ($initializing) {
            $timeout(function () {
              $initializing = false
            })
            return
          }

          if (newValue.length > oldValue.length) {
            // added
            var file = newValue[0]

            uploadService.registerFile(file.rawFile).then(function (id) {
              let url = `${$location.protocol()}://${$location.host()}`
              let port = $location.port()
              if (port !== 80 && port !== 443) {
                url += ':' + port
              }

              file.fileId = id.fileId
              file.uniqueUrl = `${url}/d/${id.peerId}${id.fileId}`
            }, function (err) {
              $log.error(err)
            })
          } else {
            // removed
            uploadService.unregisterFile(oldValue[0].fileId)
          }
        })

        $scope.getIsFileDropped = function () {
          return $rootScope.fileModel.files.length > 0
        }

        $scope.addFile = function () {
          $('#drop-box').next().trigger('click')
        }

        $scope.removeFile = function (id) {
          for (var i = 0; i < $rootScope.fileModel.files.length; i++) {
            if ($rootScope.fileModel.files[i].uniqueUrl === id) {
              $rootScope.fileModel.files.splice(i, 1)
              break
            }
          }
        }

        $scope.showPasswordDialog = function (file) {
          return $uibModal.open({
            templateUrl: 'html/upload/modals/password.html',
            controller: ['$scope', function ($scope) {
              $scope.input = {}
              $scope.input.password = file.password

              $scope.ok = function () {
                $scope.$close($scope.input.password)
              }

              $scope.close = function () {
                $scope.$dismiss('cancel')
              }
            }]
          })
        }

        $scope.lockFile = function (file) {
          $scope.modalDialogFile = file

          this.showPasswordDialog(file).result
            .then(function (password) {
              uploadService.setPasswordForFile(file.fileId, password)
              file.password = password
            })
            .catch(function () {
              uploadService.setPasswordForFile(file.fileId, '')
              file.password = ''
            })
        }

        $scope.copyToClipboard = function (fileUniqueUrl) {
          var input = angular.element('input[value=\'' + fileUniqueUrl + '\']')
          input.select()
          document.execCommand('Copy')
        }

        // save unsubscribe functions to be able unsubscribe no destruction of this controller
        var rootScopeEvents = [
          $rootScope.$on('UploadStart', function (event, peerId, fileId) {
            $scope.$apply(function () {
              for (var i = 0; i < $scope.fileModel.files.length; ++i) {
                if ($scope.fileModel.files[i].fileId === fileId) {
                  $scope.fileModel.files[i].clients[peerId] = {
                    progress: 0,
                    speed: 0
                  }

                  break
                }
              }
            })
          }),
          $rootScope.$on('UploadProgress', function (event, peerId, fileId, percent, bytesPerSecond) {
            $scope.$apply(function () {
              for (var i = 0; i < $scope.fileModel.files.length; ++i) {
                if ($scope.fileModel.files[i].fileId === fileId && $scope.fileModel.files[i].clients[peerId] !== undefined) {
                  $scope.fileModel.files[i].clients[peerId].progress = percent
                  $scope.fileModel.files[i].clients[peerId].speed = bytesPerSecond

                  break
                }
              }
            })
          }),
          $rootScope.$on('UploadFinished', function (event, peerId, fileId) {
            $scope.$apply(function () {
              for (var i = 0; i < $scope.fileModel.files.length; ++i) {
                if ($scope.fileModel.files[i].fileId === fileId) {
                  delete $scope.fileModel.files[i].clients[peerId]
                  $scope.fileModel.files[i].totalDownloads++

                  break
                }
              }
            })
          }),
          $rootScope.$on('dataChannelClose', function (event, peerId, fileId) {
            for (var i = 0; i < $rootScope.fileModel.files.length; ++i) {
              if ($rootScope.fileModel.files[i].fileId === fileId) {
                delete $rootScope.fileModel.files[i].clients[peerId]
              }

              break
            }

            if (!$scope.$$phase) { $scope.$apply(0) }
          })
        ]

        $scope.$on('$destroy', function () {
          angular.forEach(rootScopeEvents, function (offDelegate) {
            offDelegate()
          })
        })
      }])
})()
