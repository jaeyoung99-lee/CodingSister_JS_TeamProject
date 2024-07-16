// 지도 중심 좌표 주소 출력

// 좌표로 행정동 주소 정보 요청
function searchAddrFromCoords(coords, callback) {
    geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);         
}

// 지도 중심 좌표에 대한 주소정보 출력
function displayCenterInfo(result, status) {
    if (status === kakao.maps.services.Status.OK) {
        const addr = document.getElementById('centerAddr');
        
        for(let i = 0; i < result.length; i++) {
            // 행정동의 region_type 값은 'H' 이므로
            if (result[i].region_type === 'H') {
                addr.innerHTML = result[i].address_name;
                break;
            }
        }
    }    
}