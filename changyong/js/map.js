// 해당 장소의 상세정보를 보여줄 커스텀오버레이
let placeOverlay = new kakao.maps.CustomOverlay({zIndex:1}),
    contentNode = document.createElement('div'),
    markers = [],  // 'makers' 오타 수정
    markerList = [],  // 'makers' 오타 수정
    currCategory = '';

// 지도 생성
let mapContainer = document.getElementById('map'),
    mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3,
    };

const map = new kakao.maps.Map(mapContainer, mapOption); 

// 장소 검색 객체 생성
let ps = new kakao.maps.services.Places();

// 주소-좌표 변환 객체 생성
const geocoder = new kakao.maps.services.Geocoder(); 

// 현재 위치 가져오기
navigator.geolocation.getCurrentPosition((position) => {
    currentMap(position);
});

// 현재 위치를 중심으로 지도 중심 변경 & 주소 & 현재 위치 날씨
function currentMap(position) {
    const lat = position.coords.latitude; // 위도
    const lng = position.coords.longitude; // 경도
    console.log("현재 위치 좌표", lng, lat);

    map.setCenter(new kakao.maps.LatLng(lat, lng)); // 지도 중심
    currCategory = 'BK9'; // 초기 카테고리 설정 (예: 은행)
    searchPlaces(); // 현재 위치 기준으로 장소 검색 시작
}

// 중심 좌표나 확대 수준이 변경됐을 때 -> 지도 중심 주소 정보 변경, 마커 위치 변경
kakao.maps.event.addListener(map, 'idle', function() {
    searchAddrFromCoords(map.getCenter(), displayCenterInfo); // 주소 출력
    setMarker(map.getCenter()); // 마커 생성
});