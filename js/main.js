let map;
let center = { lat: null, lng: null };
let startMarker = null;
let endMarker = null;
let origin = '';
let destination = '';
let markers = [];
let clickMarkers = [];
let startName = '';
let endName = '';
let bounds = new kakao.maps.LatLngBounds();
const ps = new kakao.maps.services.Places();
const infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
const geocoder = new kakao.maps.services.Geocoder();
let currentPolyline = null;
const startInfo = document.getElementById('start-info');
const endInfo = document.getElementById('end-info');
const searchStart = document.getElementById('search-start');
const searchEnd = document.getElementById('search-end')


const initMap = () => {
  if (map) return;
  
  const mapContainer = document.getElementById("map");

  const mapOptions = {
    center: new kakao.maps.LatLng(center.lat, center.lng),
    level: 3
  };

  map = new kakao.maps.Map(mapContainer, mapOptions);

  const mapTypeControl = new kakao.maps.MapTypeControl();
  map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

  const zoomControl = new kakao.maps.ZoomControl();
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

  navigator.geolocation.getCurrentPosition((position) => {
    currentMap(position);
  });

  const currentMap = (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    console.log("현재 위치 좌표", lng, lat);

    map.setCenter(new kakao.maps.LatLng(lat, lng));
  }

  kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
    const latlng = mouseEvent.latLng;

    clearClickMarkers();

    marker = new kakao.maps.Marker({ position: latlng });
    marker.setMap(map);
    clickMarkers.push(marker);

    const infowindowContent = `
    <div style="padding:5px;font-size:12px; position: relative; height: 95px;">
      <div>위치 선택하기</div>
      <button onclick="selectLocation(${latlng.getLat()}, ${latlng.getLng()}, 'start', '클릭한 위치')">출발지로 선택하기</button>
      <button onclick="selectLocation(${latlng.getLat()}, ${latlng.getLng()}, 'end', '클릭한 위치')">도착지로 선택하기</button>
      <button style="position: absolute; top: 0; right: 0;" onclick="infowindow.close()">x</button>
    </div>
 `;
    infowindow.setContent(infowindowContent);
    infowindow.open(map, marker);
})
};

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

const handleSearch = () => {
  searchPlaces('search-start', placesSearchCallback);
}

const searchHandle = () => {
  searchPlaces('search-end', placesSearchCallback);
}

/// 출발지 또는 도착지 선택
const selectLocation = async (lat, lng, type, placeName) => {
  if (type === 'start') {
      clearClickMarkers();

      if (startMarker) {
          startMarker.setMap(null);
      }
      startMarker = new kakao.maps.Marker({
          map: map,
          position: new kakao.maps.LatLng(lat, lng)
      });
      origin = `${lng},${lat}`;
      startName = placeName; // 장소 이름 저장

      removeClickMarker(lat, lng);

      // 출발지와 도착지가 모두 설정된 경우 경로를 업데이트
      if (origin && destination) {
          getCarDirection();
      }
  } else if (type === 'end') {
      clearClickMarkers();

      if (endMarker) {
          endMarker.setMap(null);
      }
      endMarker = new kakao.maps.Marker({
          map: map,
          position: new kakao.maps.LatLng(lat, lng)
      });
      destination = `${lng},${lat}`;
      endName = placeName; // 장소 이름 저장

      // 출발지가 설정되지 않은 경우, 현재 위치를 출발지로 설정
      if (!origin) {
          try {
              const position = await getCurrentPosition();
              const currentLat = position.coords.latitude;
              const currentLng = position.coords.longitude;

              // 현재 위치를 출발지로 설정
              origin = `${currentLng},${currentLat}`;
              startName = '현위치';
              // 현재 위치 마커 추가
              if (startMarker) {
                  startMarker.setMap(null);
              }
              startMarker = new kakao.maps.Marker({
                  map: map,
                  position: new kakao.maps.LatLng(currentLat, currentLng)
              });

              console.log(`출발지 자동 설정됨: ${origin}`);
          } catch (error) {
              console.error('현재 위치를 가져오는 중 오류가 발생했습니다.', error);
              return;
          }
      }

      removeClickMarker(lat, lng);

      if (origin && destination) {
          getCarDirection();
      }
  }

  updateInfo();
  infowindow.close();
}

const clearClickMarkers = () => {
  clickMarkers.forEach(marker => marker.setMap(null));
  clickMarkers = [];
}

const removeClickMarker = (lat, lng) => {
  clickMarkers = clickMarkers.filter(marker => {
      const markerPosition = marker.getPosition();
      if (markerPosition.getLat() === lat && markerPosition.getLng() === lng) {
          return false;
      }
      return true;
  });
}

// 장소 이름을 업데이트하는 함수입니다
const updateInfo = () => {

  // 출발지와 도착지의 장소 이름을 표시합니다
  document.querySelector('.location-info').style.display = 'block'
  startInfo.textContent = `출발지 : ${startName}` || '미설정';
  endInfo.textContent = `도착지 : ${endName}` || '미설정';
};

// 장소 검색 함수
const searchPlaces = (inputId, callback) => {
  const keyword = document.getElementById(inputId).value.trim();

  if (!keyword) {
    return false;
  }

  ps.keywordSearch(keyword, callback);
};

// 장소 검색 콜백 함수
const placesSearchCallback = (data, status) => {
  if (status === kakao.maps.services.Status.OK) {
    removeMarkers();
    bounds = new kakao.maps.LatLngBounds();

    data.forEach(place => {
      const marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x)
      });

      kakao.maps.event.addListener(marker, 'click', function () {
        const content = `<div style="padding:5px;font-size:12px;">${place.place_name}<br>
          <button onclick="selectLocation(${place.y}, ${place.x}, 'start', '${place.place_name}')">출발지로 선택하기</button>
          <button onclick="selectLocation(${place.y}, ${place.x}, 'end', '${place.place_name}')">도착지로 선택하기</button>
        </div>`;
        infowindow.setContent(content);
        infowindow.open(map, marker);
      });

      markers.push(marker);
      bounds.extend(new kakao.maps.LatLng(place.y, place.x));
    });

    map.setBounds(bounds);
  } else {
    // 에러 처리
    console.error("장소 검색 중 오류가 발생했습니다:", status);
  }
};

const removeMarkers = () => {
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  clearClickMarkers();
}

const removeAll = () => {
  removeMarkers();
  
  if (currentPolyline) {
    currentPolyline.setMap(null);
    currentPolyline = null;
}

  if (startMarker) {
  startMarker.setMap(null);
  startMarker = null;
}

  if (endMarker) {
  endMarker.setMap(null);
  endMarker = null;
}

if (startInfo) {
    startInfo.textContent = '';
}

if (endInfo) {
    endInfo.textContent = '';
}

origin = '';
destination = '';
startName = '';
endName = '';
searchStart.value = '';
searchEnd.value = '';

const clickLatlng = document.getElementById('clickLatlng');
    
if (clickLatlng) {
    clickLatlng.innerHTML = '';
}
infowindow.close();

const distanceDiv = document.getElementById("between-distance");
if (distanceDiv) {
    distanceDiv.innerHTML = '';
}
}

const getCarDirection = async () => {
  const REST_API_KEY = config.restApiKey;
  const url = 'https://apis-navi.kakaomobility.com/v1/directions';

  if (!origin || !destination) {
      console.log('출발지 또는 목적지가 설정되지 않았습니다.');
      return;
  }

  const queryParams = new URLSearchParams({
      origin: origin,
      destination: destination
  });

  const requestUrl = `${url}?${queryParams.toString()}`;
  console.log(requestUrl);

  try {
      const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
              Authorization: `KakaoAK ${REST_API_KEY}`
          }
      });

      if (response.ok) {
          const data = await response.json();
          console.log(data);

          if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              drawRoute(route);

              const mapInfo = route.summary;
              console.log("차량거리", mapInfo.distance);
              console.log("차량(초)", mapInfo.duration);
              console.log("TAXI", mapInfo.fare.taxi);

              let mapDistance = mapInfo.distance;
              const distanceValue = mapDistance;
              mapDistance = mapDistance > 999 ? (Math.round(mapDistance * 0.001 * 100) / 100) + "km" : mapDistance + "m";

              const mapWalkValue = Math.round(((distanceValue * 0.001) / 4) * 60);
              const mapWalk = mapWalkValue > 59 ? `${Math.floor(mapWalkValue/60)}시간${mapWalkValue % 60}분`
                  : `${mapWalkValue}분`;

              let mapCarTime = Math.round(mapInfo.duration / 60);
              mapCarTime = mapCarTime > 59 ? `${Math.floor(mapCarTime/60)}시간${mapCarTime % 60}분`
                  : `${mapCarTime}분`;

              const mapTaxiFareValue = mapInfo.fare.taxi;
              const mapTaxiFare = new Intl.NumberFormat().format(mapTaxiFareValue);

              const distanceDiv = document.getElementById("between-distance");
              distanceDiv.innerHTML = '';
              distanceDiv.innerHTML += `<div><i class="fa-solid fa-car"></i> ${mapDistance} ${mapCarTime} ${mapTaxiFare}원</div>`
              distanceDiv.innerHTML += `<div><i class="fa-solid fa-person-walking"></i>${mapWalk}</div>`;
          } else {
              console.error('경로 데이터를 찾을 수 없습니다.');
          }
      } else {
          console.error('API 요청이 실패했습니다.', response.status, response.statusText);
      }
  } catch (error) {
      console.error('API 요청 중 오류가 발생했습니다.', error);
  }
}

const drawRoute = (route) => {
  if (!route || !route.sections) {
      console.error('경로 데이터가 올바르지 않습니다.');
      return;
  }

  const linePath = [];
  const sections = route.sections;

  sections.forEach(section => {
      const roads = section.roads;
      if (roads) {
          roads.forEach(road => {
              const vertexes = road.vertexes;
              if (vertexes) {
                  for (let i = 0; i < vertexes.length; i += 2) {
                      linePath.push(new kakao.maps.LatLng(vertexes[i + 1], vertexes[i]));
                  }
              }
          });
      }
  });

  if (currentPolyline) {
      currentPolyline.setMap(null);
  }

  currentPolyline = new kakao.maps.Polyline({
      map: map,
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
  });

  currentPolyline.setMap(map);
};

// sideNav, overLay
const overlay = document.querySelector(".overlay");
const sideNav = document.getElementById("mainSidenav");
const dropdown = document.querySelector(".dropdown_bar");
const dropdownContent = document.querySelector(".dropdown_content");
const drop_icon1 = document.querySelector(".drop_icon1");
const drop_icon2 = document.querySelector(".drop_icon2");

const openNav = () => {
  sideNav.style.width = "250px";
  overlay.style.display = "block";
  overlay.style.opacity = 0;

  const fadeEffect = setInterval(() => {
    if (!overlay.style.opacity) {
      overlay.style.opacity = 0;
    }
    if (overlay.style.opacity < 0.5) {
      overlay.style.opacity = parseFloat(overlay.style.opacity) + 0.1;
    } else {
      clearInterval(fadeEffect);
    }
  }, 50);

  overlay.addEventListener("click", () => {
    sideNav.style.width = "0px";
    const fadeOutEffect = setInterval(() => {
      if (overlay.style.opacity > 0) {
        overlay.style.opacity -= 0.1;
      } else {
        clearInterval(fadeOutEffect);
        overlay.style.display = "none";
      }
    }, 50);
  });
};

const closeNav = () => {
  sideNav.style.width = "0px";
  const fadeOutEffect = setInterval(() => {
    if (overlay.style.opacity > 0) {
      overlay.style.opacity -= 0.1;
    } else {
      clearInterval(fadeOutEffect);
      overlay.style.display = "none";
    }
  }, 50);
};

dropdown.addEventListener("click", () => {
  if (dropdownContent.style.display === "block") {
    dropdownContent.style.display = "none";
    drop_icon1.style.display = "inline-flex";
    drop_icon2.style.display = "none";
  } else {
    dropdownContent.style.display = "block";
    drop_icon1.style.display = "none";
    drop_icon2.style.display = "inline-flex";
  }
});

const startRecord = (inputId) => {
  if ('webkitSpeechRecognition' in window) {
    const keywordRecord = new webkitSpeechRecognition();
    keywordRecord.lang = 'ko-KR'; // 한국어 설정

    keywordRecord.onstart = () => {
      console.log('음성 인식 시작');
    };

    keywordRecord.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById(inputId).value = transcript;
      console.log('음성 인식 결과:', transcript);

      // 음성 인식 결과로 장소 검색 수행
      if (inputId === 'search-start') {
        handleSearch();
      } else if (inputId === 'search-end') {
        searchHandle();
      }
    };

    keywordRecord.onerror = (event) => {
      console.error('음성 인식 오류:', event.error);
    };

    keywordRecord.onend = () => {
      console.log('음성 인식 종료');
    };

    keywordRecord.start();
  } else {
    alert('음성 인식 API를 지원하지 않는 브라우저입니다.');
  }
};

document.getElementById('start-mic-start').addEventListener('click', () => startRecord('search-start'));
document.getElementById('start-mic-end').addEventListener('click', () => startRecord('search-end'));

window.onload = initMap;
const container = document.getElementById('map');
const options = {
    center: new kakao.maps.LatLng(33.450701, 126.570667),
    level: 3
};

const zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
let infowindowOpen = false;
let favorites = [];

const placesSearchCB = (data, status, pagination) => {
    if (status === kakao.maps.services.Status.OK) {
        const bounds = new kakao.maps.LatLngBounds();

        removeMarker();
        removeAllChildNodes(document.getElementById('placesList'));

        data.forEach((place) => {
            displayMarker(place);
            bounds.extend(new kakao.maps.LatLng(place.y, place.x));
        });

        displayPagination(pagination);
        displayPlaces(data);

    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
    }
};

const displayMarker = (place) => {
    const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(place.y, place.x)
    });

    marker.place_name = place.place_name;
    marker.road_address_name = place.road_address_name;
    marker.address_name = place.address_name;
    marker.phone = place.phone;

    kakao.maps.event.addListener(marker, 'mouseover', () => {
        if (!infowindowOpen) {
            const content = `<div style="padding:5px;font-size:15px;font-family:Arial, Helvetica, sans-serif;">${place.place_name}</div>`;
            infowindow.setContent(content);
            infowindow.open(map, marker);
        }
    });

    kakao.maps.event.addListener(marker, 'mouseout', () => {
        if (!infowindowOpen) {
            infowindow.close();
        }
    });

    kakao.maps.event.addListener(marker, 'click', () => {
        const infowindowContent = `<div style="padding:5px;font-size:15px;font-family:Arial, Helvetica, sans-serif;">${place.place_name}</div>`;
        infowindow.setContent(infowindowContent);
        infowindow.open(map, marker);
        infowindowOpen = true;

        kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
            if (!marker.getPosition().equals(mouseEvent.latLng)) {
                infowindow.close();
                infowindowOpen = false;
            }
        });
    });

    markers.push(marker);
};

const removeMarker = () => {
    markers.forEach((marker) => {
        marker.setMap(null);
    });
    markers = [];
};

const displayPagination = (pagination) => {
    const paginationEl = document.getElementById('pagination');
    const fragment = document.createDocumentFragment();

    removeAllChildNodes(paginationEl);

    for (let i = 1; i <= pagination.last; i++) {
        const el = document.createElement('a');
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = 'on';
        } else {
            el.onclick = (() => {
                return () => {
                    pagination.gotoPage(i);
                    scrollToTop();
                }
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
};

const scrollToTop = () => {
    const menuWrap = document.getElementById('menu_wrap');
    if (menuWrap) {
        menuWrap.scrollTop = 0;
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const displayPlaces = (places) => {
    const listEl = document.getElementById('placesList');
    const fragment = document.createDocumentFragment();

    places.forEach((place, index) => {
        const itemEl = getListItem(index, place);
        fragment.appendChild(itemEl);
    });

    listEl.appendChild(fragment);
};

const getListItem = (index, place) => {
    const el = document.createElement('li');
    el.className = 'item';

    let itemStr = `<span class="markerbg marker_${index + 1}"></span>
        <div class="info">
            <h5>${place.place_name}</h5>`;

    if (place.road_address_name) {
        itemStr += `<div><span>${place.road_address_name}</span></div>
            <div><span class="jibun gray">${place.address_name}</span></div>`;
    } else {
        itemStr += `<div><span>${place.address_name}</span></div>`;
    }

    itemStr += `<div><span class="tel">${place.phone}</span></div>
        <i class="fa-solid fa-heart favorite-icon" onclick="toggleFavorite(this, ${index})"></i>
        </div>`;

    el.innerHTML = itemStr;

    el.addEventListener('mouseover', () => {
        infowindow.setContent(`<div style="padding:5px;font-size:13px;font-family:Arial, Helvetica, sans-serif;">${place.place_name}</div>`);
        infowindow.open(map, markers[index]);
    });

    el.addEventListener('mouseout', () => {
        infowindow.close();
    });

    return el;
};

const removeAllChildNodes = (el) => {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
};

const toggleSearch = () => {
    const searchBar = document.getElementById('search-bar');
    searchBar.style.display = (searchBar.style.display === 'none' || searchBar.style.display === '') ? 'inline-block' : 'none';
};

const toggleFavorite = (element, index) => {
    element.classList.toggle('active');

    const place = markers[index].getPosition();
    const favoriteItem = {
        name: markers[index].place_name,
        lat: place.getLat(),
        lng: place.getLng(),
        road_address_name: markers[index].road_address_name,
        address_name: markers[index].address_name,
        phone: markers[index].phone
    };

    if (element.classList.contains('active')) {
        favorites.push(favoriteItem);
    } else {
        favorites = favorites.filter(fav => fav.name !== favoriteItem.name);
    }

    displayFavorites();
}

const displayFavorites = () => {
    const favoritesList = document.getElementById('favoritesList');
    removeAllChildNodes(favoritesList);

    favorites.forEach((favorite, index) => {
        const li = document.createElement('li');
        li.className = 'item';

        let itemStr = `<span class="markerbg marker_${index + 1}"></span>
            <div class="favorite-info">
                <h5>${favorite.name}<i class="fa-solid fa-heart favorite-icon active" onclick="removeFavorite(${index})"></i></h5>`;

        if (favorite.road_address_name) {
            itemStr += `<div><span>${favorite.road_address_name}</span></div>
                <div><span class="jibun gray">${favorite.address_name}</span></div>`;
        } else {
            itemStr += `<div><span>${favorite.address_name}</span></div>`;
        }

        itemStr += `<div><span class="tel">${favorite.phone}</span></div>
            </div>`;

        li.innerHTML = itemStr;

        li.addEventListener('mouseover', () => {
            infowindow.setContent(`<div style="padding:5px;font-size:13px;font-family:Arial, Helvetica, sans-serif;">${favorite.name}</div>`);
            infowindow.open(map, new kakao.maps.LatLng(favorite.lat, favorite.lng));
        });

        li.addEventListener('mouseout', () => {
            infowindow.close();
        });

        favoritesList.appendChild(li);
    });
};

const removeFavorite = (index) => {
    favorites.splice(index, 1);
    displayFavorites();
};

document.getElementById('search-button').addEventListener('click', searchPlaces);
kakao.maps.event.addListener(map, 'zoom_changed', searchPlaces);

document.querySelector('.search-tab').addEventListener('click', () => {
    document.getElementById('search-bar').focus();
});

document.querySelector('.liked-tab').addEventListener('click', () => {
    document.getElementById('favorites').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
      document.querySelector('.tab.active').classList.remove('active');
      tab.classList.add('active');

      const isSearchTab = tab.classList.contains('search-tab');

      // Show/hide relevant elements and disable/enable functionalities based on the active tab
      document.querySelector('.search-container').style.display = isSearchTab ? 'block' : 'none';
      document.getElementById('placesList').style.display = isSearchTab ? 'block' : 'none';
      document.getElementById('pagination').style.display = isSearchTab ? 'block' : 'none';
      document.getElementById('favorites').style.display = isSearchTab ? 'none' : 'block';

      // Enable/disable functionalities based on active tab
      if (isSearchTab) {
          // Enable search tab functionalities
          document.getElementById('search-start').disabled = false;
          document.getElementById('search-end').disabled = false;
          document.getElementById('search-button').disabled = false;

          // Disable route tab functionalities
          document.getElementById('search-start').disabled = true;
          document.getElementById('search-end').disabled = true;
          document.getElementById('start-mic-start').disabled = true;
          document.getElementById('start-mic-end').disabled = true;
      } else {
          // Enable route tab functionalities
          document.getElementById('search-start').disabled = true;
          document.getElementById('search-end').disabled = true;
          document.getElementById('search-button').disabled = true;

          // Disable search tab functionalities
          document.getElementById('start-mic-start').disabled = false;
          document.getElementById('start-mic-end').disabled = false;
      }
  });
});

