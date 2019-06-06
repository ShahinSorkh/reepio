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
  angular.module('upload')
    .service('uploadService', ['config', '$q', 'peeringService', 'randomService', '$rootScope', function (config, $q, peeringService, randomService, $rootScope) {
      /**
       * Connection data
       * @typedef {Object} Connection
       * @property {boolean} isAuthenticated - Has this connection provided the right password?
       * @property {FileReader} reader - file reader
       * @property {number} uploadedChunksSinceLastCalculate - Keeps track of the chungs that where send since last speed calculate
       * @property {number} chunksToSend - Total chunks left to send
       * @property {number} startByte - The startbyte of the current read
       */

      /**
       * Holds file data
       * @typedef {Object} File
       * @property {boolean} name - File name
       * @property {boolean} size - File size
       * @property {boolean} type - Mime type
       */

      /**
       * The complete Triforce, or one or more components of the Triforce.
       * @typedef {Object} UploadEntry
       * @property {File} file - File data
       * @property {Connection} connections - Connection Data
       * @property {string} password - File password. Password length > 0 = a password is set
       */

      /**
       * For every file we have a entry in this object. Key == file id
       * @type {Object.<string, UploadEntry>}
       */
      this.uploads = {}

      /**
       *
       * @param file
       * @returns {Q.promise}
       */
      this.registerFile = function (file) {
        return peeringService.getPeer()
          .then(function (peer) {
            var fileId = this.__generateFileId()

            this.uploads[fileId] = {}
            this.uploads[fileId].file = file
            this.uploads[fileId].connections = {}
            this.uploads[fileId].password = ''

            // Bind the connection event only once
            if (!peer._events) {
              peer.on('connection', function (connection) {
                connection.on('data', function (data) {
                  if (this.hasOwnProperty('__onPacket' + data.packet) === false ||
                    typeof this['__onPacket' + data.packet] !== 'function') {
                    connection.close()
                    return
                  }

                  var fn = this['__onPacket' + data.packet]
                  fn = fn.bind(this)
                  fn(data, connection)
                }.bind(this))

                connection.on('close', function () {
                  $rootScope.$emit('dataChannelClose', connection.peer, fileId)
                })
              }.bind(this))
            }

            return { peerId: peer.id, fileId: fileId, peer: peer }
          }.bind(this))
      }

      /**
       *
       * @param fileId
       * @returns {Q.promise}
       */
      this.unregisterFile = function (fileId) {
        var upload = this.uploads[fileId]
        if (typeof upload === 'undefined') { throw new Error('No file registered with id ' + fileId) }

        angular.forEach(upload.connections, function (conn, i) {
          conn.__conn.close()
          upload.connections[i] = null
        })
      }

      /**
       * Generates a radom file id
       * @returns {string}
       * @private
       */
      this.__generateFileId = function () {
        var fileId = randomService.generateString(config.fileIdLength)

        while (this.uploads.hasOwnProperty(fileId)) {
          fileId = randomService.generateString(config.fileIdLength)
        }

        return fileId
      }

      /**
       * Sets a password for a file
       * @param {string} fileId
       * @param {string} password
       */
      this.setPasswordForFile = function (fileId, password) {
        this.uploads[fileId].password = password
      }

      /**
       * Peer id and File id
       * @typedef {Object} ParsedId
       * @property {string} peerId - Peer id
       * @property {string} fileId - file id
       */

      /**
       * Gets the peer id and file id from a combined id
       * @param {string|ParsedId} id
       * @returns {ParsedId}
       */
      this.parseId = function (id) {
        if (id.hasOwnProperty('peerId')) {
          return id
        }

        return {
          peerId: id.substring(0, config.peerIdLength),
          fileId: id.substring(config.peerIdLength, config.peerIdLength + config.fileIdLength)
        }
      }

      // Packets

      /**
       * Emits UploadFinished event
       * @param data
       * @param connection
       * @private
       */
      this.__onPacketDownloadFinished = function (data, connection) {
        $rootScope.$emit('UploadFinished', connection.peer, data.fileId)
      }

      /**
       * Authenticates a connection if the password is correct
       * @param data
       * @param connection
       * @private
       */
      this.__onPacketAuthenticate = function (data, connection) {
        if (data.password === this.uploads[data.fileId].password) {
          this.uploads[data.fileId].connections[connection.peer].isAuthenticated = true

          connection.send({
            packet: 'FileInformation',
            fileId: data.fileId,
            fileName: this.uploads[data.fileId].file.name,
            fileSize: this.uploads[data.fileId].file.size,
            fileType: this.uploads[data.fileId].file.type
          })

          connection.send({
            packet: 'AuthenticationSuccessfull'
          })
        } else {
          connection.send({
            packet: 'IncorrectPassword'
          })
        }
      }

      /**
       * Sends file information or a Authentication request if the file has a password
       * @param data
       * @param connection
       * @private
       */
      this.__onPacketRequestFileInformation = function (data, connection) {
        var upload = this.uploads[data.fileId]

        if (typeof upload.connections[connection.peer] === 'undefined') {
          upload.connections[connection.peer] = {}
          upload.connections[connection.peer].isAuthenticated = upload.password.length <= 0
          upload.connections[connection.peer].__conn = connection
        }

        if (upload.connections[connection.peer].isAuthenticated) {
          connection.send({
            packet: 'FileInformation',
            fileId: data.fileId,
            fileName: this.uploads[data.fileId].file.name,
            fileSize: this.uploads[data.fileId].file.size,
            fileType: this.uploads[data.fileId].file.type
          })
        } else {
          connection.send({
            packet: 'AuthenticationRequest'
          })
        }
      }

      /**
       * Send a file block
       * @param data
       * @param connection
       * @private
       */
      this.__onPacketRequestBlock = function (data, connection) {
        var connectionData = this.uploads[data.fileId].connections[connection.peer]
        if (connectionData.isAuthenticated === false) {
          return
        }

        if (connectionData.reader === undefined) {
          // First request
          $rootScope.$emit('UploadStart', connection.peer, data.fileId)
          connectionData.uploadedChunksSinceLastCalculate = 0

          connectionData.reader = new FileReader()

          connectionData.reader.onloadend = function (evt) {
            if (evt.target.readyState === FileReader.DONE) {
              if (evt.target.result.byteLength === 0) {
                return
              }

              connection.send(evt.target.result)
              connectionData.uploadedChunksSinceLastCalculate++
              connectionData.chunksToSend--

              if (connectionData.chunksToSend === 0) {
                return
              }

              connectionData.startByte += config.chunkSize

              var blob
              if (this.uploads[data.fileId].file.blobData !== undefined) {
                blob = this.uploads[data.fileId].file.blobData.slice(connectionData.startByte, (connectionData.startByte + config.chunkSize))
              } else {
                blob = this.uploads[data.fileId].file.slice(connectionData.startByte, (connectionData.startByte + config.chunkSize))
              }

              reader.readAsArrayBuffer(blob)
            }
          }.bind(this)
        }

        var reader = connectionData.reader

        connectionData.startByte = data.chunkPosition * config.chunkSize
        connectionData.chunksToSend = config.chunksPerBlock

        var blob
        if (this.uploads[data.fileId].file.blobData !== undefined) {
          blob = this.uploads[data.fileId].file.blobData.slice(connectionData.startByte, (connectionData.startByte + config.chunkSize))
        } else {
          blob = this.uploads[data.fileId].file.slice(connectionData.startByte, (connectionData.startByte + config.chunkSize))
        }

        reader.readAsArrayBuffer(blob)
      }

      /**
       * Emits UploadProgress event
       * @param data
       * @param connection
       * @private
       */
      this.__onPacketDownloadProgress = function (data, connection) {
        $rootScope.$emit('UploadProgress', connection.peer, data.fileId, data.percent, data.bytesPerSecond)
      }
    }])
})()
