// imports
var gapfill = require('users/bibekaryal7/fall2020:gapfill.js');
var indices = require('users/bibekaryal7/fall2020:calculate_indices.js');
var ids = require('users/bibekaryal7/fall2020:ids.js');

// script parameters
var image_ids = ids.image_ids.analysis_image_ids_2,
    params = {kernel_size: 10, upscale: true, max_cloud_cover: 20},
    glaciers_hkh = ee.FeatureCollection("users/bibekaryal7/Glacier_HKH");

// Map.addLayer(glaciers_hkh, {palette: '0000FF'}, 'Glaciers_HKH')

// loop over each image
for (var i = 0; i < image_ids.length; i++) {
  var image = ee.Image('LANDSAT/LE07/C01/T1_RT/'+image_ids[i]),
      date = ee.Date(image.get('system:time_start')),
      slc_failure_date = ee.Date(new Date(2003, 5, 31)),
      image_name = image.id().getInfo().toString();
  if (date >= slc_failure_date){
    var wrs_row_source = image.get("WRS_ROW"),
        wrs_path_source = image.get("WRS_PATH"),
        raw_2000 = ee.ImageCollection('LANDSAT/LE07/C01/T1_RT')
          .filterDate("2000-01-01", "2000-12-31")
          .filter(ee.Filter.eq('WRS_ROW', wrs_row_source))
          .filter(ee.Filter.eq('WRS_PATH', wrs_path_source))
          .filter(ee.Filter.lt("CLOUD_COVER", params.max_cloud_cover));
    var fill = ee.Image(raw_2000.sort('CLOUD_COVER').first());
    image = gapfill.GapFill(fill, image, params.kernel_size, params.upscale);
  }

  // get indices
  image = indices.addIndex(image, ["B4", "B3"], "ndvi");
  image = indices.addIndex(image, ["B2", "B5"], "ndsi");
  image = indices.addIndex(image, ["B4", "B5"], "ndwi");

  // get slopes
  var elevation = ee.Image('CGIAR/SRTM90_V4')
      .select('elevation'),
      slope = ee.Terrain.slope(elevation);
  image = ee.Image.cat([image.float(), elevation.float(), slope.float()]);

  // save to drive folder
  Export.image.toDrive({
    image: image,
    folder: 'EEImages',
    description: image_name,
    region: image.geometry(),
    scale: 30
  });

  //var geometry = image.geometry();
  //Map.addLayer(geometry, {}, 'geom');
  //Map.addLayer(image, {bands: ['B5', 'B4', 'B2'], min: 0, max: 255}, 'raw');
}
