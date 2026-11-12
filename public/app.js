const $ = (id) => document.getElementById(id);

const TOAST_DURATION_MS = 5000;
let ws = null;
let apiToken = '';
let deviceRefreshTimer = null;

const labels = {
  door_open: 'Porta aberta',
  door_closed: 'Porta fechada',
  motion: 'Movimento detectado',
};

const deviceKindLabels = {
  door: 'Porta',
  sensor: 'Sensor',
  outlet: 'Tomada',
};

const deviceStatusLabels = {
  online: 'Online',
  offline: 'Offline',
  unknown: 'Desconhecido',
};

const deviceStateLabels = {
  open: 'Aberta',
  closed: 'Fechada',
  motion_detected: 'Movimento detectado',
  unknown: 'Sem estado conhecido',
};

function showToast(message) {
  const container = $('toast-container');
  const toast = document.createElement('div');
  const content = document.createElement('div');
  const progress = document.createElement('div');

  toast.className = 'toast';
  content.className = 'toast-content';
  progress.className = 'toast-progress';
  content.textContent = message;

  toast.append(content, progress);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
    progress.style.transition = `width ${TOAST_DURATION_MS}ms linear`;
    progress.style.width = '0%';
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 220);
  }, TOAST_DURATION_MS);
}

function setStatus(message) {
  $('status').textContent = message;
}

function addEvent(event) {
  const list = $('events');
  const item = document.createElement('li');
  const text = document.createElement('span');
  const deleteButton = document.createElement('button');
  const formattedDate = new Date(event.created_at).toLocaleString('pt-BR');
  const description = labels[event.type] || event.type;
  const source = event.source === 'device' ? 'Dispositivo' : 'Simulado';

  item.className = 'event-item';
  text.textContent = `${formattedDate} — ${event.device}: ${description} (${source})`;

  deleteButton.type = 'button';
  deleteButton.textContent = 'Excluir';
  deleteButton.className = 'event-delete';
  deleteButton.addEventListener('click', async () => {
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Falha ao excluir evento. HTTP ${response.status}`);
      }

      item.remove();
      showToast('Evento removido com sucesso.');
      await loadEvents();
      await loadDevices();
    } catch (error) {
      showToast(error.message);
    }
  });

  item.append(text, deleteButton);
  list.prepend(item);
}

function renderDevices(devices = []) {
  const container = $('device-list');
  const eventDeviceSelect = $('event-device');
  const currentSelection = eventDeviceSelect.value;
  eventDeviceSelect.replaceChildren();

  const simulatedOption = document.createElement('option');
  simulatedOption.value = '';
  simulatedOption.textContent = 'Sensor de teste (não cadastrado)';
  eventDeviceSelect.appendChild(simulatedOption);

  devices.forEach((device) => {
    const option = document.createElement('option');
    option.value = device.id;
    option.textContent = `${device.name} (${deviceKindLabels[device.kind] || device.kind})`;
    option.dataset.deviceName = device.name;
    eventDeviceSelect.appendChild(option);
  });

  eventDeviceSelect.value = devices.some((device) => device.id === currentSelection)
    ? currentSelection
    : '';

  container.replaceChildren();

  devices.forEach((device) => {
    const card = document.createElement('article');
    card.className = 'device-card';

    const header = document.createElement('div');
    const name = document.createElement('strong');
    const kind = document.createElement('span');
    header.className = 'device-card-header';
    name.textContent = device.name;
    kind.className = 'device-kind-badge';
    kind.textContent = deviceKindLabels[device.kind] || device.kind;
    header.append(name, kind);

    const state = document.createElement('div');
    state.className = `device-state ${device.state}`;
    state.textContent = `Estado: ${deviceStateLabels[device.state] || deviceStateLabels.unknown}`;

    const connection = document.createElement('div');
    connection.className = `device-connection ${device.connection_status}`;
    connection.textContent = `Conexão: ${deviceStatusLabels[device.connection_status] || deviceStatusLabels.unknown}`;

    const lastEvent = document.createElement('p');
    lastEvent.className = 'device-meta';
    lastEvent.textContent = `Último evento: ${device.last_event_type ? labels[device.last_event_type] || device.last_event_type : 'Nenhum registro'}`;

    const lastSeen = document.createElement('p');
    lastSeen.className = 'device-meta';
    lastSeen.textContent = `Último sinal: ${device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('pt-BR') : 'Nunca recebido'}`;

    const actions = document.createElement('div');
    actions.className = 'device-actions';
    const deleteButton = document.createElement('button');
    deleteButton.className = 'device-delete';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', async () => {
      try {
        const response = await fetch(`/api/devices/${encodeURIComponent(device.id)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Falha ao excluir dispositivo. HTTP ${response.status}`);
        }

        await loadDevices();
        showToast('Dispositivo removido com sucesso.');
      } catch (error) {
        showToast(error.message);
      }
    });
    actions.appendChild(deleteButton);

    card.append(header, state, connection, lastEvent, lastSeen, actions);
    container.appendChild(card);
  });
}

async function loadDevices() {
  if (!apiToken) {
    renderDevices([]);
    return;
  }

  try {
    const response = await fetch('/api/devices', {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar dispositivos. HTTP ${response.status}`);
    }

    const devices = await response.json();
    renderDevices(devices);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadEvents() {
  const response = await fetch('/api/events', {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar eventos. HTTP ${response.status}`);
  }

  const events = await response.json();
  $('events').replaceChildren();
  events.reverse().forEach(addEvent);
}

async function connect() {
  const token = $('token').value.trim();

  if (!token) {
    showToast('Informe o token da API.');
    return;
  }

  apiToken = '';

  if (ws) {
    ws.close();
    ws = null;
  }

  setStatus('Conectando...');

  try {
    const response = await fetch('/api/events', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Falha na autenticação. HTTP ${response.status}`);
    }

    apiToken = token;

    await loadEvents();
    await loadDevices();
    if (deviceRefreshTimer) {
      clearInterval(deviceRefreshTimer);
    }
    deviceRefreshTimer = setInterval(loadDevices, 30000);

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/ws`;

    ws = new WebSocket(url, ['home-events', `auth.${apiToken}`]);

    ws.onopen = () => {
      setStatus('Conectado');
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);

      if (data.kind === 'event') {
        addEvent(data.data);
        loadDevices().catch((error) => showToast(error.message));
      }
    };

    ws.onclose = () => {
      setStatus('Desconectado');
    };

    ws.onerror = () => {
      setStatus('Erro na conexão WebSocket');
    };
  } catch (error) {
    apiToken = '';
    setStatus(`Erro: ${error.message}`);
    showToast(error.message);
  }
}

async function registerDevice() {
  const name = $('device-name').value.trim();
  const kind = $('device-kind').value;

  if (!name) {
    showToast('Informe o nome do dispositivo.');
    return;
  }

  if (!apiToken) {
    showToast('Conecte-se primeiro.');
    return;
  }

  try {
    const response = await fetch('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ name, kind }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao cadastrar dispositivo. HTTP ${response.status}`);
    }

    $('device-name').value = '';
    await loadDevices();
    showToast('Dispositivo cadastrado com sucesso.');
  } catch (error) {
    showToast(error.message);
  }
}

async function sendSyntheticEvent(eventType) {
  const selectedDevice = $('event-device').value || 'Sensor de teste';
  const selectedDeviceName = $('event-device').selectedOptions[0].dataset.deviceName || selectedDevice;

  if (!apiToken) {
    showToast('Conecte-se primeiro.');
    return;
  }

  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        device: selectedDeviceName,
        deviceId: selectedDevice || undefined,
        type: eventType,
        source: 'simulated',
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao registrar evento. HTTP ${response.status}`);
    }
  } catch (error) {
    showToast(error.message);
  }
}

$('connect').addEventListener('click', connect);
$('register-device').addEventListener('click', registerDevice);

document.querySelectorAll('[data-event]').forEach((button) => {
  button.addEventListener('click', () => sendSyntheticEvent(button.dataset.event));
});

renderDevices([]);
