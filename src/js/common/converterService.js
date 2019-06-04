/* globals angular */
/**
 * Created by andre (http://korve.github.io/) on 06.12.2014
 */

(function () {
  'use strict'

  angular.module('common')
    .factory('converterService', function () {
      return {
        // http://jsfiddle.net/Mottie/xcqpF/1/light/
        rgb2hex: function (rgb) {
          rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i)
          return (rgb && rgb.length === 4) ? ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) : ''
        }
      }
    })
})()
