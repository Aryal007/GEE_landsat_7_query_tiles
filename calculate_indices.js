exports.addIndex = function(image, bands, band_name) {
  var ndvi = image.normalizedDifference(bands).rename(band_name);
  return image.addBands(ndvi);
}