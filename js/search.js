let container = document.getElementById('map');
let options = {
    center: new kakao.maps.LatLng(33.450701, 126.570667),
    level: 3
};

let map = new kakao.maps.Map(container, options);
let zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
let ps = new kakao.maps.services.Places();
let infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

let infowindowOpen = false;
let markers = [];
let favorites = [];

function handleSearch(event) {
    if (event.key === 'Enter') {
        searchPlaces();
    }
}

function searchPlaces() {
    let keyword = document.getElementById('search-bar').value.trim();

    if (!keyword) {
        alert('키워드를 입력해주세요!');
        return false;
    }

    ps.keywordSearch(keyword, placesSearchCB, { bounds: map.getBounds() });
}

function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        let bounds = new kakao.maps.LatLngBounds();

        removeMarker();
        removeAllChildNodes(document.getElementById('placesList'));

        data.forEach(function (place, index) {
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
}

function displayMarker(place) {
    let marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x)
    });

    marker.place_name = place.place_name;
    marker.road_address_name = place.road_address_name;
    marker.address_name = place.address_name;
    marker.phone = place.phone;

    kakao.maps.event.addListener(marker, 'mouseover', function () {
        if (!infowindowOpen) {
            let content = '<div style="padding:5px;font-size:15px;font-family:Arial, Helvetica, sans-serif;">' +
                place.place_name + '</div>';
            infowindow.setContent(content);
            infowindow.open(map, marker);
        }
    });

    kakao.maps.event.addListener(marker, 'mouseout', function () {
        if (!infowindowOpen) {
            infowindow.close();
        }
    });

    kakao.maps.event.addListener(marker, 'click', function () {
        let infowindowContent = '<div style="padding:5px;font-size:15px;font-family:Arial, Helvetica, sans-serif;">' +
            place.place_name + '</div>';
        infowindow.setContent(infowindowContent);
        infowindow.open(map, marker);
        infowindowOpen = true;

        kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
            if (!marker.getPosition().equals(mouseEvent.latLng)) {
                infowindow.close();
                infowindowOpen = false;
            }
        });
    });

    markers.push(marker);
}

function removeMarker() {
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];
}

function displayPagination(pagination) {
    let paginationEl = document.getElementById('pagination'),
        fragment = document.createDocumentFragment();

    removeAllChildNodes(paginationEl);

    for (let i = 1; i <= pagination.last; i++) {
        let el = document.createElement('a');
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = 'on';
        } else {
            el.onclick = (function (i) {
                return function () {
                    pagination.gotoPage(i);
                    scrollToTop();
                }
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}

function scrollToTop() {
    let menuWrap = document.getElementById('menu_wrap');
    if (menuWrap) {
        menuWrap.scrollTop = 0;
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function displayPlaces(places) {
    let listEl = document.getElementById('placesList');
    let fragment = document.createDocumentFragment();

    places.forEach(function (place, index) {
        let itemEl = getListItem(index, place);
        fragment.appendChild(itemEl);
    });

    listEl.appendChild(fragment);
}

function getListItem(index, place) {
    let el = document.createElement('li');
    el.className = 'item';

    let itemStr = '<span class="markerbg marker_' + (index + 1) + '"></span>' +
        '<div class="info">' +
        '<h5>' + place.place_name + '</h5>';

    if (place.road_address_name) {
        itemStr += '<div><span>' + place.road_address_name + '</span></div>' +
            '<div><span class="jibun gray">' + place.address_name + '</span></div>';
    } else {
        itemStr += '<div><span>' + place.address_name + '</span></div>';
    }

    itemStr += '<div><span class="tel">' + place.phone + '</span></div>' +
        '<i class="fa-solid fa-heart favorite-icon" onclick="toggleFavorite(this, ' + index + ')"></i>' +
        '</div>';

    el.innerHTML = itemStr;

    el.addEventListener('mouseover', function () {
        infowindow.setContent('<div style="padding:5px;font-size:13px;font-family:Arial, Helvetica, sans-serif;">' + place.place_name + '</div>');
        infowindow.open(map, markers[index]);
    });

    el.addEventListener('mouseout', function () {
        infowindow.close();
    });

    return el;
}

function removeAllChildNodes(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

function toggleSearch() {
    let searchBar = document.getElementById('search-bar');
    searchBar.style.display = (searchBar.style.display === 'none' || searchBar.style.display === '') ? 'inline-block' : 'none';
}

function toggleFavorite(element, index) {
    element.classList.toggle('active');

    let place = markers[index].getPosition();
    let favoriteItem = {
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

function displayFavorites() {
    let favoritesList = document.getElementById('favoritesList');
    removeAllChildNodes(favoritesList);

    favorites.forEach(function (favorite, index) {
        let li = document.createElement('li');
        li.className = 'item';

        let itemStr = '<span class="markerbg marker_' + (index + 1) + '"></span>' +
            '<div class="favorite-info">' +
            '<h5>' + favorite.name + '<i class="fa-solid fa-heart favorite-icon active" onclick="removeFavorite(' + index + ')"></i></h5>';

        if (favorite.road_address_name) {
            itemStr += '<div><span>' + favorite.road_address_name + '</span></div>' +
                '<div><span class="jibun gray">' + favorite.address_name + '</span></div>';
        } else {
            itemStr += '<div><span>' + favorite.address_name + '</span></div>';
        }

        itemStr += '<div><span class="tel">' + favorite.phone + '</span></div>' +
            '</div>';

        li.innerHTML = itemStr;

        li.addEventListener('mouseover', function () {
            infowindow.setContent('<div style="padding:5px;font-size:13px;font-family:Arial, Helvetica, sans-serif;">' + favorite.name + '</div>');
            infowindow.open(map, new kakao.maps.LatLng(favorite.lat, favorite.lng));
        });

        li.addEventListener('mouseout', function () {
            infowindow.close();
        });

        favoritesList.appendChild(li);
    });
}

function removeFavorite(index) {
    favorites.splice(index, 1);
    displayFavorites();
}

document.getElementById('search-button').addEventListener('click', searchPlaces);
kakao.maps.event.addListener(map, 'zoom_changed', searchPlaces);

document.querySelector('.search-tab').addEventListener('click', () => {
    document.getElementById('search-bar').focus();
});

document.querySelector('.liked-tab').addEventListener('click', () => {
    document.getElementById('favorites').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelector('.tab.active').classList.remove('active');
        tab.classList.add('active');

        if (tab.classList.contains('search-tab')) {
            document.querySelector('.search-container').style.display = 'block';
            document.getElementById('placesList').style.display = 'block';
            document.getElementById('pagination').style.display = 'block';
            document.getElementById('favorites').style.display = 'none';
        } else {
            document.querySelector('.search-container').style.display = 'none';
            document.getElementById('placesList').style.display = 'none';
            document.getElementById('pagination').style.display = 'none';
            document.getElementById('favorites').style.display = 'block';
        }
    });
});
