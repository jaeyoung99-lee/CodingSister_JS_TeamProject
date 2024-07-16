// 지도 중심에 마커 생성
function setMarker(coords){
    // console.log(coords);
    const lat = coords.getLat(); // 위도
    const lng = coords.getLng(); // 경도
    console.log("지도 이동, 현재 중심 좌표", lng, lat);

    for(let marker of markerList){
        marker.setMap(null);
    }
    markerList = []; // 마커 초기화

    let center = new kakao.maps.LatLng(lat, lng);
    let marker = new kakao.maps.Marker({ // 마커 생성
        map: map,
        position: center
    });
    markerList.push(marker);
}