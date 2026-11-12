const cameras = [
  { id: 'camera1', name: 'Câmera 1' },
  { id: 'camera2', name: 'Câmera 2' },
  { id: 'camera3', name: 'Câmera 3' },
  { id: 'camera4', name: 'Câmera 4' },
];

const streamPort = 8888;
const streamUrl = (camera) => `http://${location.hostname}:${streamPort}/${camera.id}/`;
const mainCamera = document.getElementById('main-camera');
const mainCameraFrame = document.getElementById('main-camera-frame');
const selectedCameraTitle = document.getElementById('selected-camera-title');
const fullscreenButton = document.getElementById('fullscreen-button');
const fullscreenLabel = document.getElementById('fullscreen-label');
const cameraList = document.getElementById('camera-list');
let selectedCameraId = cameras[0].id;

function selectCamera(camera) {
  selectedCameraId = camera.id;
  mainCamera.src = streamUrl(camera);
  mainCamera.title = `Transmissão ao vivo da ${camera.name}`;
  selectedCameraTitle.textContent = camera.name;

  cameraList.querySelectorAll('.camera-card').forEach((card) => {
    const isSelected = card.dataset.cameraId === camera.id;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  });
}

function renderCameraList() {
  cameras.forEach((camera) => {
    const card = document.createElement('button');
    const preview = document.createElement('iframe');
    const details = document.createElement('span');
    const name = document.createElement('strong');
    const status = document.createElement('span');

    card.type = 'button';
    card.className = 'camera-card';
    card.dataset.cameraId = camera.id;
    card.setAttribute('aria-label', `Selecionar ${camera.name}`);
    card.setAttribute('aria-pressed', 'false');

    preview.src = streamUrl(camera);
    preview.title = `Prévia da ${camera.name}`;
    preview.tabIndex = -1;
    preview.setAttribute('aria-hidden', 'true');
    preview.allow = 'autoplay';

    details.className = 'camera-card-details';
    name.textContent = camera.name;
    status.className = 'camera-status';
    status.textContent = 'Configurada';
    details.append(name, status);
    card.append(preview, details);

    card.addEventListener('click', () => selectCamera(camera));
    cameraList.appendChild(card);
  });
}

fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await mainCameraFrame.requestFullscreen();
  } catch (error) {
    console.error('Não foi possível alternar para tela cheia.', error);
  }
});

document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement === mainCameraFrame;
  fullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
  fullscreenButton.setAttribute(
    'aria-label',
    isFullscreen ? 'Voltar ao tamanho normal' : 'Maximizar vídeo',
  );
  fullscreenLabel.textContent = isFullscreen ? 'Tamanho normal' : 'Maximizar';
});

document.getElementById('back-button').addEventListener('click', () => {
  if (history.length > 1) {
    history.back();
  } else {
    location.href = './';
  }
});

renderCameraList();
selectCamera(cameras[0]);
