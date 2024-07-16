import config from './config.js';

const kakaoMapApiKey = config.kakaoMapApiKey;

document.addEventListener('DOMContentLoaded', () => {
  const kakaoMapScript = document.getElementById('kakaoMapScript');
  kakaoMapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&libraries=services`;
});