var dup = require('dup')
var map = require('map-async')
var cells = require('cell-range')
var round = Math.round
var min = Math.min
var max = Math.max
var abs = Math.abs

module.exports = observer

function observer(field, range, linger) {
  range = (+range|0) || 1
  linger = max((+linger|0) - range, range)

  var shape = field.shape
  var dims = shape.length
  var neighbours = cells(dup(dims, -range), dup(dims, range))

  return function observe(places, callback) {
    if (!Array.isArray(places[0])) places = [places]
    callback = callback || function(){}

    map(places, function(coord, next) {
      coord = coord.slice()
      var i = dims
      while (i--) coord[i] = round(coord[i] / shape[i])

      map(neighbours, function(offset, next) {
        var pos = coord.slice()
        var i = dims
        while (i--) pos[i] += offset[i]
        field.chunk(pos, next)
      }, next)
    }, function(err) {
      if (err) return next(err)

      var closest = Infinity
      var flagged = []
      var distance = 0
      var l = places.length
      var pos
      var i

      var pages = field.index.pages
      for (var p = 0; p < pages.length; p += 1)
      for (var c = 0; c < pages[p].length; c += 1) {
        pos = pages[p][c].position

        for (i = 0; i < l; i += 1) {
          distance = 0
          for (var d = 0; d < dims; d += 1) {
            distance += abs(pos[d] - places[i][d] / shape[d])
          }

          closest = distance < closest
            ? distance
            : closest
        }

        if (closest > range + linger) flagged.push(pos)
      }

      i = flagged.length
      while (i--) field.remove(flagged[i])

      return callback(null)
    })
  }
}
