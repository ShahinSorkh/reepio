/* globals inject */
/* eslint-env node, jasmine */
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

  describe('randomService tests', function () {
    beforeEach(module('common'))

    describe('generateString function tests', function () {
      it('should generate a random string with a length of 6 correctly', inject(function (randomService) {
        expect(randomService.generateString(6).length).toBe(6)
      }))
      it('should have a defaultLength defined', inject(function (randomService) {
        expect(randomService.defaultLength).toBeDefined()
      }))
      it('should return a random string the length of defaultLength if length param is omitted', inject(function (randomService) {
        expect(randomService.generateString().length).toBe(randomService.defaultLength)
      }))
    })
  })
})()
