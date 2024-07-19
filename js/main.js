let map;
let center = { lat: 33.452613, lng: 126.570888 };
let startMarker = null;
let endMarker = null;
let origin = '';
let destination = '';
let markers = [];
let startName = '';
let endName = '';
let bounds = new kakao.maps.LatLngBounds();
const ps = new kakao.maps.services.Places();
const infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
const geocoder = new kakao.maps.services.Geocoder();

const initMap = () => {
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
};

const handleSearch = () => {
  searchPlaces('search-start', placesSearchCallback);
}

const searchHandle = () => {
  searchPlaces('search-end', placesSearchCallback);
}

// 현재 위치를 가져오는 함수
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error)
    );
  });
};

/// 출발지 또는 도착지 선택
const selectLocation = async (lat, lng, type, placeName) => {
  if (type === 'start') {
    if (startMarker) {
      startMarker.setMap(null);
    }
    startMarker = new kakao.maps.Marker({
      map: map,
      position: new kakao.maps.LatLng(lat, lng)
    });
    origin = `${lng},${lat}`;
    startName = placeName; // 장소 이름 저장
  } else if (type === 'end') {
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
        startName = '현위치'
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

    if (origin && destination) {
      getCarDirection();
    }
  }

  updateInfo();
  infowindow.close();
}

// 장소 이름을 업데이트하는 함수입니다
const updateInfo = () => {
  const startInfo = document.getElementById('start-info');
  const endInfo = document.getElementById('end-info');

  // 출발지와 도착지의 장소 이름을 표시합니다
  document.querySelector('.location-info').style.display = 'block'
  startInfo.textContent = `출발지 : ${startName}` || '미설정';
  endInfo.textContent = `도착지 : ${endName}` || '미설정';
};

// 장소 검색 함수
const searchPlaces = (inputId, callback) => {
  const keyword = document.getElementById(inputId).value.trim();

  if (!keyword) {
    alert('키워드를 입력해주세요!');
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

  const headers = {
    Authorization: `KakaoAK ${REST_API_KEY}`
  };

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const mapInfo = data.routes[0].summary;
    console.log("data:", data);
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
    distanceDiv.innerHTML = `${mapDistance} ${mapCarTime} ${mapTaxiFare}원 ${mapWalk}`;

    const linePath = [];
    data.routes[0].sections[0].roads.forEach(router => {
      router.vertexes.forEach((vertex, index) => {
        if (index % 2 === 0) {
          linePath.push(new kakao.maps.LatLng(router.vertexes[index + 1], router.vertexes[index]));
        }
      });
    });

    const polyline = new kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#000000',
      strokeOpacity: 0.7,
      strokeStyle: 'solid'
    });

    polyline.setMap(map);
  } catch (error) {
    console.error('Error:', error);
  }
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

window.onload = initMap;
