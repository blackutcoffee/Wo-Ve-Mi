var coordinates = [];
var currentMap;
var markers = [];

//Centers map on zipcode entry plus adds entity markers 
var displayMap = function (zipCode, samResults) {
  coordinates = [];
  // Fetchs mapbox location via zipcode
  fetch(
    "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
      zipCode +
      ".json?country=US&types=postcode&access_token=pk.eyJ1IjoibmlnaHRwaWNuaWMiLCJhIjoiY2toMHpyanQ2MTIwcTJwcGcxdXM1Y25zcyJ9.3s7JF30Ao0zbepk-0kKMMw"
  )
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (region) {
          var regionLngLat = region.features[0].center; // Retains longitude/latitude values/attri.

          // Creates centered mapbox around entered zip code 
          mapboxgl.accessToken =
            "pk.eyJ1IjoibmlnaHRwaWNuaWMiLCJhIjoiY2toM3hzcTQzMDZqZjJxbnd5dG56amFpOCJ9.RGnPCTAZ3oZvzUcyfQJvjQ";
          var map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/streets-v11", // Stylesheet location
            center: regionLngLat,
            zoom: 12, // Starts zoom
          });

          map.scrollZoom.disable();
          map.addControl(new mapboxgl.NavigationControl());

          currentMap = map;
          // Iterates through objects holding list of businesses filtered via (function) mapbox API call to procure longitute/latitude of each business
          for (var i = 0; i < samResults.results.length; i++) {
            fetch(
              "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
                encodeURIComponent(
                  samResults.results[i].samAddress.line1 + " "
                ) +
                zipCode +
                ".json?country=US&proximity=" +
                regionLngLat +
                "&access_token=pk.eyJ1IjoibmlnaHRwaWNuaWMiLCJhIjoiY2toMHpyanQ2MTIwcTJwcGcxdXM1Y25zcyJ9.3s7JF30Ao0zbepk-0kKMMw"
            ).then(function (response) {
              if (response.ok) {
                response.json().then(function (data) {
                  // Creates/ Adds Maps marker at long/lat of DUNS.
                  coordinates.push(data.features[0].center);
                });
              }
            });
          }
        });
      } else {
        displayModal("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      displayModal("Unable to connect to database");
    });

  // Time allotted for each fetch request from coordinates to finish, then creates markers.
  setTimeout(createMarkers, 1000, samResults);
};

var createMarkers = function (data) {
  markers = [];
  // Loop thru list of coordinates and draw marker at each location with address as pop-up
  for (var i = 0; i < coordinates.length; i++) {
    var popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
      `${data.results[i].legalBusinessName} <br /> ${
        data.results[i].samAddress.line1
      } <br /> ${data.results[i].samAddress.city.toLowerCase()}, ${
        data.results[i].samAddress.stateOrProvince
      } <br /> ${data.results[i].samAddress.zip}`
    );

    var marker = new mapboxgl.Marker()
      .setLngLat(coordinates[i])
      .setPopup(popup)
      .addTo(currentMap);

    markers.push(marker);
  }
};

// Function that makes request to SAM API and returns JSON-formatted object containing requested category of business
var getBusinesses = function (zipCode) {
  var apiOptions = ""; // Variable holding the search terms that will be passed to the SAM API URL
  $(":checkbox").each(function () {
    if ($(this).is(":checked")) {
      apiOptions += "+AND+(" + $(this).val() + ":true)";
      localStorage.setItem($(this).val(), "checked");
    } else {
      localStorage.setItem($(this).val(), "notChecked");
    }
  });
  localStorage.setItem("zip", zipCode);
  // API URL with options
  var apiUrl =
    "https://api.data.gov/sam/v3/registrations?qterms=(samAddress.zip:" +
    zipCode +
    ")" +
    "+AND+(samAddress.country:USA)" +
    apiOptions +
    "&start=1&length=500&api_key=2tCFIl3AFvdJwux6OEwWsvyJ4pzI4MY7Rva0GmJh";

  // Fatching for URL request
  fetch(apiUrl)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          if (data.results.length == 0) {
            displayModal("No businesses found.");
          } else {
            displayBusiness(data);
            displayMap(zipCode, data);
          }
        });
      } else {
        displayModal("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      // Display modal if fetch fails: Disconnect ethernet/wifi adapter for SSID reset..
      displayModal("Unable to connect to database");
    });
};

// Update HTML elements Then display businesses in cards alongside with creating map
var displayBusiness = function (data) {
  // Clear Previous Card State
  $(".cardCont").remove();

  for (i = 0; i < data.results.length || i == 40; i++) {
    let cardContainer = document.createElement("article");
    cardContainer.classList = "w3-col s12 l6 w3-padding cardCont";

    let card = document.createElement("div");
    card.classList = "w3-card-4 w-3-margin-bottom";

    let headerWrapper = document.createElement("a")
    headerWrapper.setAttribute("href", `https://www.google.com/search?q=${data.results[i].legalBusinessName}`)
    headerWrapper.setAttribute("target", "_blank")


    let cardHeader = document.createElement("header");
    cardHeader.classList = "w3-container w3-dark-grey w3-hover-gray";



    let headerText = document.createElement("h3");
    let name = data.results[i].legalBusinessName;
    headerText.innerHTML = name;
    headerText.classList = "w3-xlarge"

    cardHeader.appendChild(headerText);
    headerWrapper.appendChild(cardHeader);

    // Add header to card
    card.appendChild(headerWrapper);

    let cardBody = document.createElement("div");
    cardBody.classList = "w3-container w3-sand";

    let cardImage = document.createElement("img");
    cardImage.setAttribute("src", "https://picsum.photos/60");
    cardImage.setAttribute("alt", "Icon");
    cardImage.classList =
      "w3-left w3-circle w3-margin-top w3-margin-right w3-margin-bottom";
    // cardBody.appendChild(cardImage);

    let address = document.createElement("p");
    address.classList = "w3-small w3-margin-top w3-margin-bottom w3-center";
    address.innerHTML = `${
      data.results[i].samAddress.line1
    } <br /> ${data.results[i].samAddress.city.toLowerCase()}, ${
      data.results[i].samAddress.stateOrProvince
    } <br /> ${data.results[i].samAddress.zip}`;
    cardBody.appendChild(address);
    // Add body to card
    card.appendChild(cardBody);

    let button = document.createElement("button");
    button.classList = "w3-button w3-block w3-amber card-button";
    button.innerHTML = "Show on Map";
    button.setAttribute("data-id", i);
    button.setAttribute("onclick", "location.href='#map'");
    // Add button to card
    card.appendChild(button);
    // Upload the new card to the card container
    cardContainer.appendChild(card);

    $(cardContainer).insertAfter($("#map"));
  }
};

// Verify correct zipcode (i.e., between 00000 and 99999)
var isZipCode = function (str) {
  regexp = /^[0-9]{5}?$/;

  return regexp.test(str);
};

// Display modal string is error text for p element inside card
var displayModal = function (str) {
  $("#error-text").text(str);
  $("#errorModal").toggle();
};

$(document).on("click", ".card-button", function () {
  // Jump to clicked entity location 
  currentMap.jumpTo({ center: coordinates[$(this).attr("data-id")], zoom: 15 });

  // Pop-up for map marker when not open
  if (!markers[$(this).attr("data-id")].getPopup().isOpen()) {
    markers[$(this).attr("data-id")].togglePopup();
  }

  // Loop thru array of markers and close all the other marker pop-ups besides the one for the marker that was just clicked
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].getPopup().isOpen() && i != $(this).attr("data-id")) {
      markers[i].togglePopup();
    }
  }
});

$("#search-form").submit(function (event) {
  var zipcode = $("#zip-code").val();

  if (!isZipCode(zipcode)) {
    displayModal("Error: Please enter valid zip code");
    return false;
  }

  // Check that the list of checked checkboxes includes at least one element (i.e., a checkbox has been checked). If so, call getBusinesses() function. Otherwise alert user to error.
  if ($("#search-form input[type=checkbox]:checked").length && zipcode) {
    getBusinesses(zipcode);
  } else {
    displayModal(
      "Error: Make sure at least one checkbox is selected and zip code has been entered!"
    );
    return false;
  }
  event.preventDefault();
});

// When first loaded, clear previous search parameters, then ascertain/call past search from local storage
$(document).ready(function () {
  let pastSearch = [];

  if (isZipCode(localStorage["zip"])) {
    pastSearch.push(localStorage.getItem("zip"));
    if (localStorage["womanOwned"] == "checked") {
      pastSearch.push("womanOwned");
    }
    if (localStorage["veteranOwned"] == "checked") {
      pastSearch.push("veteranOwned");
    }
    if (localStorage["minorityOwned"] == "checked") {
      pastSearch.push("minorityOwned");
    }

    $(":checkbox").each(function () {
      if (pastSearch.includes($(this).val())) {
        $(this).prop("checked", true);
      }
    });
    $("#zip-code").val(pastSearch[0]);
    getBusinesses(pastSearch[0]);
  } else {
    return;
  }
});
