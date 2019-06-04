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

  describe('detectCrawlerService module tests', function () {
    beforeEach(module('common'))

    describe('isCrawler function tests', function () {
      it('should be defined', inject(function (detectCrawlerService) {
        expect(detectCrawlerService.isCrawler).toBeDefined()
        expect(typeof detectCrawlerService.isCrawler).toBe('function')
      }))

      it('should return false for invalid values', inject(function (detectCrawlerService) {
        expect(detectCrawlerService.isCrawler('')).toBe(false)
        expect(detectCrawlerService.isCrawler(' ')).toBe(false)
        expect(detectCrawlerService.isCrawler()).toBe(false)
        expect(detectCrawlerService.isCrawler(null)).toBe(false)
        expect(detectCrawlerService.isCrawler(true)).toBe(false)
        expect(detectCrawlerService.isCrawler(false)).toBe(false)
      }))

      it('should detect google agents as crawler', inject(function (detectCrawlerService) {
        expect(detectCrawlerService.isCrawler('Googlebot')).toBe(true)
        expect(detectCrawlerService.isCrawler('Googlebot-News (Googlebot)')).toBe(true)
        expect(detectCrawlerService.isCrawler('Googlebot-Image (Googlebot)')).toBe(true)
        expect(detectCrawlerService.isCrawler('Googlebot-Video (Googlebot)')).toBe(true)
        expect(detectCrawlerService.isCrawler('Mediapartners-Google')).toBe(true)
        expect(detectCrawlerService.isCrawler('Mediapartners (Googlebot)')).toBe(true)
        expect(detectCrawlerService.isCrawler('AdsBot-Google')).toBe(true)
      }))

      it('should detect bing agents as crawler', inject(function (detectCrawlerService) {
        expect(detectCrawlerService.isCrawler('Bingbot')).toBe(true)
        expect(detectCrawlerService.isCrawler('Adidxbot')).toBe(true)
        expect(detectCrawlerService.isCrawler('MSNBot')).toBe(true)
        expect(detectCrawlerService.isCrawler('BingPreview')).toBe(true)
      }))

      it('should detect yahoo agents as crawler', inject(function (detectCrawlerService) {
        expect(detectCrawlerService.isCrawler('Yahoo Slurp')).toBe(true)
        expect(detectCrawlerService.isCrawler('Yahoo! Slurp China')).toBe(true)
      }))

      it('should detect duckduckgo agents as crawler', inject(function (detectCrawlerService) {
        expect(detectCrawlerService.isCrawler('DuckDuckBot')).toBe(true)
      }))
    })
  })
})()
