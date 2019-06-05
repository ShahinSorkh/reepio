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
  angular.module('download')
    .service('downloadService', ['config', '$q', 'peeringService', 'randomService', '$rootScope', 'storageService', function (config, $q, peeringService, randomService, $rootScope, storageService) {
      this.id = null

      this.connection = null

      this.file = {
        name: '',
        type: '',
        size: 0,
        totalChunksToReceive: 0,
        chunksReceived: 0,
        chunksOfCurrentBlockReceived: 0,
        downloadedChunksSinceLastCalculate: 0,
        progress: 0,
        noFileSystem: false,
        isStreamAble: false
      }

      this.streamBuffer = []
      this.isStream = false
      this.isStreamingRunning = false
      this.intervalProgress = null

      this.downloadState = 'connecting'
      $rootScope.$emit('DownloadStateChanged', this.downloadState)

      this.requestFileInformation = function (id) {
        if (this.id !== null) {
          return
        }

        this.id = this.parseId(id)

        peeringService
          .getPeer()
          .then(function (peer) {
            this.connection = peer.connect(this.id.uploaderId, {
              reliable: true
            })

            this.connection.on('close', function (e) {
              $rootScope.$emit('DownloadDataChannelClose')
            })

            this.connection.on('data', function (data) {
              if (data instanceof ArrayBuffer) {
                this.__onPacketFileData(data)
                return
              }

              var fn = this['__onPacket' + data.packet]

              if (typeof fn === 'function') {
                fn = fn.bind(this)
                fn(data)
              }
            }.bind(this))

            this.connection.on('open', function () {
              if (this.file.name.length === 0) {
                this.connection.send({
                  packet: 'RequestFileInformation',
                  fileId: this.id.fileId
                })
              }
            }.bind(this))

            this.connection.on('error', function (e) {
              $rootScope.$emit('DownloadDataChannelClose')
            })

            peer.on('error', function (e) {
              $rootScope.$emit('DownloadDataChannelClose')
            })
          }.bind(this))
      }

      this.parseId = function (id) {
        if (id.hasOwnProperty('uploaderId')) {
          return id
        }

        return {
          uploaderId: id.substring(0, config.peerIdLength),
          fileId: id.substring(config.peerIdLength, config.peerIdLength + config.fileIdLength)
        }
      }

      this.startDownload = function () {
        if (this.file.name.length === 0) {
          return
        }

        this.downloadState = 'inprogress'
        $rootScope.$emit('DownloadStateChanged', this.downloadState)

        this.intervalProgress = setInterval(this.progressCalculations.bind(this), 1000)
        var self = this
        storageService.getStorageForFile(this.file.name, this.file.size).then(
          function (fileIdentifier) {
            this.file.fileIdentifier = fileIdentifier

            var fileEntry = storageService.getFileEntry(fileIdentifier)

            if (self.isStream) {
              if (fileEntry !== undefined) {
                fileEntry.file(function (file) {
                  var reader = new FileReader()

                  reader.onloadend = function (e) {
                    self.appendChunkToStream(this.result)
                    self.requestBlock(self.file.chunksReceived)
                  }

                  reader.readAsArrayBuffer(file)
                }, function () {})

                return
              }
            }

            this.requestBlock(this.file.chunksReceived)
          }.bind(this),
          function (fileIdentifier) {
            this.file.fileIdentifier = fileIdentifier
            this.file.noFileSystem = true
            this.requestBlock(0)

            $rootScope.$emit('NoFileSystem', this.file)
          }.bind(this)
        )
      }

      this.startStream = function () {
        this.video = document.querySelector('video')
        this.mediaSource = new MediaSource()
        this.video.src = window.URL.createObjectURL(this.mediaSource)

        this.mediaSource.addEventListener('sourceopen', function () {
          this.sourceBuffer = this.mediaSource.addSourceBuffer(this.getCodecToType(this.file.type))
          this.startDownload()

          this.sourceBuffer.addEventListener('updateend', function (e) {
            if (this.streamBuffer.length > 0) {
              this.appendChunkToStream(this.streamBuffer.shift())
            } else {
              this.streamInterval = setInterval(function () {
                if (this.streamBuffer.length > 0) {
                  this.appendChunkToStream(this.streamBuffer.shift())
                  clearInterval(this.streamInterval)
                }
              }.bind(this), 50)
            }
          }.bind(this))

          this.sourceBuffer.addEventListener('error', function (e) { console.log(e) })
        }.bind(this), false)
        this.mediaSource.addEventListener('error', function (e) { console.log(e) })

        this.isStreamingRunning = true
        this.isStream = true
      }

      this.appendChunkToStream = function (chunk) {
        try {
          this.sourceBuffer.appendBuffer(new Uint8Array(chunk))
        } catch (e) {
          this.abortStream()
        }
      }

      this.abortStream = function () {
        this.isStream = false
        this.isStreamingRunning = false
        this.streamBuffer = []
        //                clearInterval(this.intervalProgress);
        clearInterval(this.streamInterval)
        //                this.cancelUpload();
        $rootScope.$emit('errorPlayingStream')
      }

      this.progressCalculations = function () {
        this.file.bytesPerSecond = (this.file.downloadedChunksSinceLastCalculate * config.chunkSize)

        $rootScope.$emit('intervalCalculations', this.file.bytesPerSecond, this.file.progress)

        this.connection.send({
          packet: 'DownloadProgress',
          bytesPerSecond: this.file.bytesPerSecond,
          percent: this.file.progress,
          fileId: this.id.fileId
        })

        this.file.downloadedChunksSinceLastCalculate = 0
      }

      this.requestBlock = function (chunkPosition) {
        this.connection.send({
          packet: 'RequestBlock',
          fileId: this.id.fileId,
          chunkPosition: chunkPosition
        })
      }

      this.doAuthentication = function (password) {
        this.connection.send({
          packet: 'Authenticate',
          password: password,
          fileId: this.id.fileId
        })
      }

      this.isStreamAble = function (type) {
        window.MediaSource = window.MediaSource || window.WebKitMediaSource

        if (window.MediaSource === undefined) {
          return false
        }

        return MediaSource.isTypeSupported(this.getCodecToType(type))
      }

      this.getCodecToType = function (type) {
        if (type === 'video/mp4') {
          return 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        }

        if (type === 'video/ogg') {
          return 'video/ogg; codecs="theora, vorbis"'
        }

        if (type === 'video/webm') {
          return 'video/webm; codecs="vorbis, vp8, vp9"'
        }

        return 'No codec found'
      }

      this.__onPacketFileData = function (data) {
        if (this.isStream) {
          if (this.file.chunksReceived === 0) {
            this.appendChunkToStream(data)
          } else {
            this.streamBuffer.push(data)
          }
        }

        this.file.chunksReceived++
        this.file.chunksOfCurrentBlockReceived++
        this.file.downloadedChunksSinceLastCalculate++
        this.file.progress = (this.file.chunksReceived / this.file.totalChunksToReceive) * 100

        if (this.file.chunksReceived !== this.file.totalChunksToReceive && (this.file.chunksOfCurrentBlockReceived % config.chunksPerBlock) === 0) {
          this.file.chunksOfCurrentBlockReceived = 0
          this.requestBlock(this.file.chunksReceived)
        }

        storageService.addChunkToFileBuffer(this.file.fileIdentifier, data)

        if (this.file.chunksReceived === this.file.totalChunksToReceive) {
          storageService.getUrlForFinishedDownload(this.file.fileIdentifier).then(
            function (url) {
              clearInterval(this.intervalProgress)
              this.progressCalculations()
              this.file.fileSystemUrl = url
              this.downloadState = 'finished'
              $rootScope.$emit('DownloadStateChanged', this.downloadState)

              $rootScope.$emit('DownloadFinished')

              this.connection.send({
                packet: 'DownloadFinished',
                fileId: this.id.fileId
              })
            }.bind(this)
          )
        }
      }

      this.__onPacketAuthenticationSuccessfull = function (data) {
        $rootScope.$emit('AuthenticationSuccessfull')
      }

      this.__onPacketIncorrectPassword = function (data) {
        $rootScope.$emit('IncorrectPassword')
      }

      this.__onPacketFileInformation = function (data) {
        this.file.name = data.fileName
        this.file.size = data.fileSize
        this.file.type = data.fileType
        this.file.isStreamAble = this.isStreamAble(data.fileType)
        this.file.totalChunksToReceive = Math.ceil(data.fileSize / config.chunkSize)

        this.downloadState = 'ready'
        $rootScope.$emit('DownloadStateChanged', this.downloadState)

        storageService.checkIfFileExits(data.fileName, data.fileSize).then(
          function (metaData) {
            this.file.chunksReceived = Math.ceil(metaData.size / config.chunkSize)
            this.file.progress = (this.file.chunksReceived / this.file.totalChunksToReceive) * 100

            if (this.file.progress === 100) {
              storageService.getUrlForFinishedDownload(storageService.generateFileIdentifier(data.fileName, data.fileSize)).then(
                function (url) {
                  this.downloadState = 'finished'
                  $rootScope.$emit('DownloadStateChanged', this.downloadState)

                  this.file.fileSystemUrl = url

                  $rootScope.$emit('FileInformation', this.file)
                }.bind(this)
              )
            } else {
              $rootScope.$emit('FileInformation', this.file)
            }
          }.bind(this),
          function () {
            $rootScope.$emit('FileInformation', this.file)
          }
        )
      }

      this.__onPacketAuthenticationRequest = function (data) {
        this.downloadState = 'authentication'
        $rootScope.$emit('DownloadStateChanged', this.downloadState)

        $rootScope.$emit('AuthenticationRequest')
      }
    }])
})()
