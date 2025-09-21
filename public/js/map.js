
  mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
  container: 'map',
  center: coordinates,    // [lng, lat]
  zoom: 9
});

console.log("Coordinates in map.js:", coordinates);

new mapboxgl.Marker({color: 'red'})
  .setLngLat(coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 }) // add popups
        .setHTML(
            `<h4>Listing Location</h4><p>${coordinates}</p>`
        )
    )
  .addTo(map);
