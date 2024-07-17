// 엘리먼트에 이벤트 핸들러를 등록하는 함수입니다
const addEventHandle = (target, type, callback) => {
  if (target.addEventListener) {
      target.addEventListener(type, callback);
  } else {
      target.attachEvent(`on${type}`, callback);
  }
}

// 카테고리 검색을 요청하는 함수입니다
const searchPlacesCategory = () => {
  if (!currCategory) {
      return;
  }
  
  // 커스텀 오버레이를 숨깁니다 
  placeOverlay.setMap(null);

  // 지도에 표시되고 있는 마커를 제거합니다
  removeMarker();
  
  ps.categorySearch(currCategory, placesSearchCB, {location: map.getCenter(), radius: 1000}); 
}

// 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
const placesSearchCB = (data, status, _pagination) => {
  if (status === kakao.maps.services.Status.OK) {
      // 정상적으로 검색이 완료됐으면 지도에 마커를 표출합니다
      displayPlaces(data);
      
      categoryCounts[currCategory] += data.length;
      console.log(`현재 카테고리(${currCategory})의 총 장소 수: ${categoryCounts[currCategory]}`);

      // 현재 페이지의 결과 수를 추가하여 총 검색 결과 수를 업데이트합니다
      totalPlacesCount += data.length;
      console.log(`현재까지 검색된 총 장소의 수: ${totalPlacesCount}`);

      pagination = _pagination; // 페이지네이션 객체 저장

      // 다음 페이지가 있을 경우 추가로 검색
      if (pagination.hasNextPage) {
          pagination.nextPage();
      }

  } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
      // 검색결과가 없는경우 해야할 처리가 있다면 이곳에 작성해 주세요
      console.log("검색 결과가 없습니다.");
  } else if (status === kakao.maps.services.Status.ERROR) {
      // 에러로 인해 검색결과가 나오지 않은 경우 해야할 처리가 있다면 이곳에 작성해 주세요
      console.error("검색 중 오류가 발생했습니다.");
  }
}

// 지도에 마커를 표출하는 함수입니다
const displayPlaces = places => {
  // 몇번째 카테고리가 선택되어 있는지 얻어옵니다
  // 이 순서는 스프라이트 이미지에서의 위치를 계산하는데 사용됩니다
  const order = document.getElementById(currCategory).getAttribute('data-order');
  
  places.forEach(place => {
      // 마커를 생성하고 지도에 표시합니다
      const marker = addMarker(new kakao.maps.LatLng(place.y, place.x), order);

      // 마커와 검색결과 항목을 클릭 했을 때
      // 장소정보를 표출하도록 클릭 이벤트를 등록합니다
      kakao.maps.event.addListener(marker, 'click', () => {
          displayPlaceInfo(place);
      });
  });
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
const addMarker = (position, order) => {
  const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/places_category.png', // 마커 이미지 url, 스프라이트 이미지를 씁니다
      imageSize = new kakao.maps.Size(27, 28),  // 마커 이미지의 크기
      imgOptions =  {
          spriteSize : new kakao.maps.Size(72, 208), // 스프라이트 이미지의 크기
          spriteOrigin : new kakao.maps.Point(46, (order*36)), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
          offset: new kakao.maps.Point(11, 28) // 마커 좌표에 일치시킬 이미지 내에서의 좌표
      },
      markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
      marker = new kakao.maps.Marker({
          position, // 마커의 위치
          image: markerImage 
      });

  marker.setMap(map); // 지도 위에 마커를 표출합니다
  markers.push(marker);  // 배열에 생성된 마커를 추가합니다

  return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거합니다
const removeMarker = () => {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

// 클릭한 마커에 대한 장소 상세정보를 커스텀 오버레이로 표시하는 함수입니다
const displayPlaceInfo = place => {
  let content = `<div class="placeinfo">
                  <a class="title" href="${place.place_url}" target="_blank" title="${place.place_name}">${place.place_name}</a>`;
  
  if (place.road_address_name) {
      content += `<span title="${place.road_address_name}">${place.road_address_name}</span>
                  <span class="jibun" title="${place.address_name}">(지번 : ${place.address_name})</span>`;
  } else {
      content += `<span title="${place.address_name}">${place.address_name}</span>`;
  }
  
  content += `<span class="tel">${place.phone}</span></div><div class="after"></div>`;

  contentNode.innerHTML = content;
  placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
  placeOverlay.setMap(map);  
}

// 각 카테고리에 클릭 이벤트를 등록합니다
const addCategoryClickEvent = () => {
  const category = document.getElementById('category');
  const children = Array.from(category.children);

  children.forEach(child => {
      child.addEventListener('click', onClickCategory);
  });
}

// 카테고리를 클릭했을 때 호출되는 함수입니다
const onClickCategory = function() {
  const { id, className } = this;

  placeOverlay.setMap(null);

  if (className === 'on') {
      currCategory = '';
      changeCategoryClass();
      removeMarker();
  } else {
      currCategory = id;
      changeCategoryClass(this);
      searchPlacesCategory();
  }
}

// 클릭된 카테고리에만 클릭된 스타일을 적용하는 함수입니다
const changeCategoryClass = el => {
  const category = document.getElementById('category');
  const children = Array.from(category.children);

  children.forEach(child => child.className = '');

  if (el) {
      el.className = 'on';
  }
}

// 지도에 idle 이벤트를 등록합니다
kakao.maps.event.addListener(map, 'idle', searchPlacesCategory);

// 커스텀 오버레이의 컨텐츠 노드에 css class를 추가합니다 
contentNode.className = 'placeinfo_wrap';

// 커스텀 오버레이의 컨텐츠 노드에 mousedown, touchstart 이벤트가 발생했을때
// 지도 객체에 이벤트가 전달되지 않도록 이벤트 핸들러로 kakao.maps.event.preventMap 메소드를 등록합니다 
addEventHandle(contentNode, 'mousedown', kakao.maps.event.preventMap);
addEventHandle(contentNode, 'touchstart', kakao.maps.event.preventMap);

// 커스텀 오버레이 컨텐츠를 설정합니다
placeOverlay.setContent(contentNode);  

// 각 카테고리에 클릭 이벤트를 등록합니다
addCategoryClickEvent();
