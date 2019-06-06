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

  describe('common.crypto module', function () {
    describe('common.crypto.crc32 function tests', function () {
      var testString, crc

      beforeEach(module('common'))
      beforeEach(function () {
        testString = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Architecto, ea ex ipsa itaque quis totam?'
        crc = '8F02C325'
      })

      it('should be defined', inject(function ($crypto) {
        expect($crypto.crc32).toBeDefined()
      }))

      it('should yield the correct crc hash for testString', inject(function ($crypto) {
        expect($crypto.crc32(testString)).toBe(crc)
      }))

      it('should return a hash for valid values', inject(function ($crypto) {
        expect($crypto.crc32(testString)).toBeTruthy()
        expect($crypto.crc32(0)).toBeTruthy()
        expect($crypto.crc32('0')).toBeTruthy()
        expect($crypto.crc32(' ')).toBeTruthy()
      }))

      it('should return null for invalid values', inject(function ($crypto) {
        expect($crypto.crc32(null)).toBeNull()
        expect($crypto.crc32('')).toBeNull()
      }))
    })
  })
})()
