/* globals inject */
/* eslint-env node, jasmine */
'use strict'

describe('download module tests', function () {
  beforeEach(function () {
    module('peertome')
  })

  var scope

  describe('DownloadCtrl', function () {
    beforeEach(module('download'))

    beforeEach(inject(function ($rootScope, $controller, $crypto) {
      $rootScope.downloadId = 'MockDownloadId'
      $rootScope.cryptoDownloadId = $crypto.crc32($rootScope.downloadId)
      $rootScope.downloadService = function () {
        this.requestFileInformation = function (downloadId) {
        }
        this.startDownload = function () {
        }
      }

      scope = $rootScope.$new()
      $controller('DownloadCtrl', {
        '$scope': scope
      })
    }))

    it('should have a function "downloadFile" that starts the download', inject(function (downloadService) {
      spyOn(downloadService, 'startDownload')

      scope.downloadFile()
      expect(downloadService.startDownload).toHaveBeenCalled()
    }))
  })
})
