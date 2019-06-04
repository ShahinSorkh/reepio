/* globals angular */
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

  angular.module('titleController', ['fileFilters'])
    .controller('TitleController', ['$scope', '$rootScope', '$element', '$filter', function ($scope, $rootScope, $element, $filter) {
      var divider = ' | '

      var clientOnIntervalCalculations = function (e, bytesPerSecond, downloadProgress) {
        var speed = $filter('humanFileSize')(bytesPerSecond)

        $element.html(Math.round(downloadProgress) + '%' + divider + speed + '/s' + divider + 'reep.io')
      }

      var removeIntervalCalculationsEvent

      var rootScopeEvents = [
        $rootScope.$on('DownloadStateChanged', function (e, state) {
          if (typeof e === 'undefined') { return }

          if (state === 'inprogress') {
            // keep user updated on download progress
            removeIntervalCalculationsEvent = $rootScope.$on('intervalCalculations', clientOnIntervalCalculations)
          } else {
            if (typeof removeIntervalCalculationsEvent !== 'undefined') { removeIntervalCalculationsEvent() }

            $element.html('reep.io' + divider + 'peer-to-peer filesharing made easy')
          }
        })
      ]

      $scope.$on('$destroy', function (e) {
        angular.forEach(rootScopeEvents, function (offDelegate) {
          offDelegate()
        })
      })
    }])
})()
