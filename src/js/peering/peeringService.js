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

import { Peer } from 'peerjs/lib/peer'

(function () {
  angular.module('peering', [])
    .service('peeringService', ['config', '$q', 'randomService', function (config, $q, randomService) {
      this.peer = null

      this.getPeer = function () {
        var timeout

        var deferred = $q.defer()

        if (this.peer !== null) {
          deferred.resolve(this.peer)
          return deferred.promise
        }

        var peer = new Peer(randomService.generateString(config.peerIdLength), config.peerConfig)

        peer.on('open', function (id) {
          clearInterval(timeout)
          deferred.resolve(peer)
        })

        peer.on('error', function (e) {
          clearInterval(timeout)
          deferred.reject(e)
        })

        timeout = setTimeout(function () {
          deferred.reject()
        }, typeof config.peerConfig.timeout === 'undefined' ? 10000 : config.peerConfig.timeout)

        this.peer = peer
        return deferred.promise
      }
    }])
})()
