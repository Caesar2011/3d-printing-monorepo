/** @param {string} id */
function $(id) {
  return document.getElementById(id)
}

// ── Status bar ─────────────────────────────────────────────────────────

let statusTimer = null

function setStatus(text) {
  const el = $('status')
  el.textContent = text
  el.classList.add('updating')
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => el.classList.remove('updating'), 2000)
}

// ── State ──────────────────────────────────────────────────────────────

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

const state = {
  darkMode: prefersDark.matches,
  showEdges: false,
  projectionMode: 1,
  navigationMode: 1,
  modelLoaded: false,
  wsConnected: false,
  renderMode: 'websocket',
}

let embeddedViewer = null
let lastCamera = null
let initialCamera = null
let ws = null
let wsReconnectTimer = null

// ── Theme ──────────────────────────────────────────────────────────────

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light')
  $('icon-sun').style.display = state.darkMode ? 'none' : 'block'
  $('icon-moon').style.display = state.darkMode ? 'block' : 'none'
  applyBackgroundColor()
}

function toggleTheme() {
  state.darkMode = !state.darkMode
  applyTheme()
}

prefersDark.addEventListener('change', (e) => {
  state.darkMode = e.matches
  applyTheme()
})

// ── OV helpers ─────────────────────────────────────────────────────────

function bgColor() {
  return state.darkMode ? new OV.RGBAColor(42, 42, 42, 255) : new OV.RGBAColor(240, 240, 240, 255)
}

function edgeSettings() {
  const c = state.darkMode ? new OV.RGBColor(100, 100, 100) : new OV.RGBColor(50, 50, 50)
  return new OV.EdgeSettings(state.showEdges, c, 1)
}

function getViewer() {
  return embeddedViewer ? embeddedViewer.GetViewer() : null
}

function getBoundingSphere() {
  const v = getViewer()
  return v ? v.GetBoundingSphere(() => true) : null
}

function saveCamera() {
  const v = getViewer()
  if (!v) return
  try {
    lastCamera = v.GetCamera().Clone()
  } catch (_) {}
}

function captureInitialCamera() {
  const v = getViewer()
  if (!v || initialCamera) return
  try {
    initialCamera = v.GetCamera().Clone()
  } catch (_) {}
}

function applyBackgroundColor() {
  const v = getViewer()
  if (v) v.SetBackgroundColor(bgColor())
}

function applyViewerSettings(v) {
  if (lastCamera)
    try {
      v.SetCamera(lastCamera)
    } catch (_) {}
  try {
    v.SetProjectionMode(state.projectionMode)
  } catch (_) {}
  try {
    v.SetNavigationMode(state.navigationMode)
  } catch (_) {}
}

// ── JSON → OV Model ───────────────────────────────────────────────────

function jsonSceneToOvModel(scene) {
  const model = new OV.Model()

  // Z-up → Y-up
  const t = new OV.Transformation()
  const m = new OV.Matrix()
  m.CreateRotationAxisAngle(new OV.Coord3D(1, 0, 0), -Math.PI / 2)
  t.SetMatrix(m)
  model.GetRootNode().SetTransformation(t)

  for (const jm of scene.meshes) {
    if (jm.triangles.length === 0) continue

    const mat = new OV.PhongMaterial()
    if (jm.color) {
      mat.color = new OV.RGBColor(
        Math.round(jm.color[0] * 255),
        Math.round(jm.color[1] * 255),
        Math.round(jm.color[2] * 255),
      )
      mat.opacity = jm.color[3]
    } else {
      mat.color = new OV.RGBColor(200, 200, 200)
    }
    const matIdx = model.AddMaterial(mat)

    const mesh = new OV.Mesh()
    mesh.SetName(jm.name || '')

    for (const tri of jm.triangles) {
      const [p0, p1, p2] = tri.vertices
      const i0 = mesh.AddVertex(new OV.Coord3D(p0.x, p0.y, p0.z))
      const i1 = mesh.AddVertex(new OV.Coord3D(p1.x, p1.y, p1.z))
      const i2 = mesh.AddVertex(new OV.Coord3D(p2.x, p2.y, p2.z))

      const ax = p1.x - p0.x,
        ay = p1.y - p0.y,
        az = p1.z - p0.z
      const bx = p2.x - p0.x,
        by = p2.y - p0.y,
        bz = p2.z - p0.z
      const nx = ay * bz - az * by
      const ny = az * bx - ax * bz
      const nz = ax * by - ay * bx
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
      const ni = mesh.AddNormal(new OV.Coord3D(nx / len, ny / len, nz / len))

      const triangle = new OV.Triangle(i0, i1, i2)
      triangle.SetNormals(ni, ni, ni)
      triangle.SetMaterial(matIdx)
      mesh.AddTriangle(triangle)
    }

    model.AddMeshToRootNode(mesh)
  }

  return model
}

// ── Display ────────────────────────────────────────────────────────────

function displayJsonScene(scene, isInitial) {
  const v = getViewer()
  if (!embeddedViewer || !v) return

  if (!isInitial) saveCamera()
  setStatus('Building scene…')

  const model = jsonSceneToOvModel(scene)
  OV.FinalizeModel(model, {
    defaultMaterialColor: new OV.RGBColor(200, 200, 200),
    defaultLineMaterialColor: new OV.RGBColor(100, 100, 100),
  })

  const cp = new OV.ModelToThreeConversionParams()
  const co = new OV.ModelToThreeConversionOutput()

  OV.ConvertModelToThreeObject(model, cp, co, {
    onTextureLoaded() {},
    onModelLoaded(obj) {
      v.SetMainObject(obj)
      const s = v.GetBoundingSphere(() => true)
      if (s) {
        v.AdjustClippingPlanesToSphere(s)
        if (!lastCamera) v.FitSphereToWindow(s, false)
      }
      applyViewerSettings(v)
      state.modelLoaded = true
      captureInitialCamera()
      setStatus(isInitial ? 'Model loaded' : 'Scene updated')
    },
  })
}

function loadFromFile() {
  if (!embeddedViewer) return
  saveCamera()
  setStatus('Loading 3MF…')
  embeddedViewer.LoadModelFromUrlList(['output.3mf?t=' + Date.now()])
}

// ── Viewer lifecycle ───────────────────────────────────────────────────

function createViewer() {
  const el = $('viewer')
  el.style.width = window.innerWidth + 'px'
  el.style.height = window.innerHeight + 'px'
  state.modelLoaded = false

  const params = {
    backgroundColor: bgColor(),
    defaultColor: new OV.RGBColor(200, 200, 200),
    edgeSettings: edgeSettings(),
    onModelLoaded() {
      state.modelLoaded = true
      setStatus('Model loaded (3MF)')
      const v = getViewer()
      if (v) applyViewerSettings(v)
      captureInitialCamera()
    },
    onModelLoadFailed() {
      setStatus('3MF load failed')
    },
  }
  if (lastCamera) params.camera = lastCamera

  embeddedViewer = new OV.EmbeddedViewer(el, params)
}

function loadInitialScene() {
  setStatus('Loading scene…')
  fetch('/api/scene', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((scene) => {
      if (scene && scene.version === 1 && Array.isArray(scene.meshes)) {
        displayJsonScene(scene, true)
      } else {
        setStatus('No scene yet — waiting for updates')
      }
    })
    .catch(() => setStatus('Failed to load scene'))
}

// ── Render mode ────────────────────────────────────────────────────────

function updateModeUI() {
  const is3mf = state.renderMode === '3mf'
  $('mode-label').textContent = is3mf ? '3MF' : 'WS'
  $('btn-mode').setAttribute('data-active', is3mf.toString())
  $('mode-indicator').className = 'indicator' + (is3mf ? ' mode-3mf' : '')
  $('mode-indicator').title = 'Mode: ' + (is3mf ? '3MF hot-reload' : 'WebSocket')
}

function toggleMode() {
  const newMode = state.renderMode === 'websocket' ? '3mf' : 'websocket'
  fetch('/api/mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: newMode }),
  })
    .then((r) => r.json())
    .then((data) => {
      state.renderMode = data.mode
      updateModeUI()
      setStatus('Mode: ' + (data.mode === '3mf' ? '3MF hot-reload' : 'WebSocket'))
      if (data.mode === '3mf') loadFromFile()
    })
    .catch(() => setStatus('Failed to switch mode'))
}

// ── WebSocket ──────────────────────────────────────────────────────────

function updateWsUI() {
  const el = $('ws-indicator')
  el.className = 'indicator ' + (state.wsConnected ? 'connected' : 'disconnected')
  el.title = 'WebSocket: ' + (state.wsConnected ? 'connected' : 'disconnected')
}

function connectWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(protocol + '//' + location.host + '/ws')

  ws.onopen = () => {
    state.wsConnected = true
    updateWsUI()
    setStatus('WebSocket connected')
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)

      if (msg.type === 'mode') {
        state.renderMode = msg.mode
        updateModeUI()
        return
      }

      if (msg.type === '3mf-updated' && state.renderMode === '3mf') {
        loadFromFile()
        return
      }

      if (msg.version === 1 && Array.isArray(msg.meshes) && state.renderMode === 'websocket') {
        displayJsonScene(msg, false)
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e)
    }
  }

  ws.onclose = () => {
    state.wsConnected = false
    updateWsUI()
    clearTimeout(wsReconnectTimer)
    wsReconnectTimer = setTimeout(connectWebSocket, 2000)
  }

  ws.onerror = () => {
    state.wsConnected = false
    updateWsUI()
  }
}

// ── View presets ───────────────────────────────────────────────────────
// Presets are in Y-up viewer space (model rotated from Z-up → Y-up).

function setViewPreset(eyeX, eyeY, eyeZ, upX, upY, upZ) {
  if (!state.modelLoaded) return
  const v = getViewer()
  const s = getBoundingSphere()
  if (!v || !s) return

  const c = new OV.Coord3D(s.center.x, s.center.y, s.center.z)
  const d = s.radius * 2.5
  const eye = new OV.Coord3D(c.x + eyeX * d, c.y + eyeY * d, c.z + eyeZ * d)
  v.SetCamera(new OV.Camera(eye, c, new OV.Coord3D(upX, upY, upZ), 45))
  v.FitSphereToWindow(s, true)
}

function restoreHomeView() {
  if (!state.modelLoaded) return
  const v = getViewer()
  const s = getBoundingSphere()
  if (!v || !s) return
  if (initialCamera) {
    v.SetCamera(initialCamera.Clone())
    v.FitSphereToWindow(s, true)
  }
}

// ── Button dispatch ────────────────────────────────────────────────────

const actions = {
  'btn-theme': toggleTheme,
  'btn-fit'() {
    if (!state.modelLoaded) return
    const v = getViewer(),
      s = getBoundingSphere()
    if (v && s) v.FitSphereToWindow(s, false)
  },
  'btn-fit-anim'() {
    if (!state.modelLoaded) return
    const v = getViewer(),
      s = getBoundingSphere()
    if (v && s) v.FitSphereToWindow(s, true)
  },
  'btn-projection'() {
    if (!state.modelLoaded) return
    state.projectionMode = state.projectionMode === 1 ? 2 : 1
    $('proj-label').textContent = state.projectionMode === 1 ? 'P' : 'O'
    const v = getViewer()
    if (v) v.SetProjectionMode(state.projectionMode)
    setStatus(state.projectionMode === 1 ? 'Perspective' : 'Orthographic')
  },
  'btn-navmode'() {
    if (!state.modelLoaded) return
    state.navigationMode = state.navigationMode === 1 ? 2 : 1
    $('btn-navmode').setAttribute('data-active', (state.navigationMode === 2).toString())
    const v = getViewer()
    if (v) v.SetNavigationMode(state.navigationMode)
    setStatus(state.navigationMode === 1 ? 'Fixed Up Vector' : 'Free Orbit')
  },
  'btn-flipup'() {
    if (!state.modelLoaded) return
    const v = getViewer()
    if (v) {
      v.FlipUpVector()
      setStatus('Up vector flipped')
    }
  },
  'btn-edges'() {
    state.showEdges = !state.showEdges
    $('btn-edges').setAttribute('data-active', state.showEdges.toString())
    const v = getViewer()
    if (v) v.SetEdgeSettings(edgeSettings())
  },
  'btn-mode': toggleMode,
  'btn-help'() {
    $('help-panel').classList.toggle('visible')
  },
  'btn-view-home': restoreHomeView,
  'btn-view-front'() {
    setViewPreset(0, 0, 1, 0, 1, 0)
  },
  'btn-view-back'() {
    setViewPreset(0, 0, -1, 0, 1, 0)
  },
  'btn-view-top'() {
    setViewPreset(0, 1, 0, 0, 0, -1)
  },
  'btn-view-bottom'() {
    setViewPreset(0, -1, 0, 0, 0, 1)
  },
  'btn-view-right'() {
    setViewPreset(1, 0, 0, 0, 1, 0)
  },
  'btn-view-left'() {
    setViewPreset(-1, 0, 0, 0, 1, 0)
  },
}

for (const [id, handler] of Object.entries(actions)) {
  $(id).addEventListener('click', handler)
}

// ── Keyboard shortcuts ─────────────────────────────────────────────────

const keyMap = {
  f(e) {
    $(e.shiftKey ? 'btn-fit-anim' : 'btn-fit').click()
  },
  p() {
    $('btn-projection').click()
  },
  o() {
    $('btn-navmode').click()
  },
  u() {
    $('btn-flipup').click()
  },
  e() {
    $('btn-edges').click()
  },
  t() {
    $('btn-theme').click()
  },
  m() {
    $('btn-mode').click()
  },
  '?'() {
    $('btn-help').click()
  },
  '/'(e) {
    if (e.shiftKey) $('btn-help').click()
  },
  0() {
    $('btn-view-home').click()
  },
  1() {
    $('btn-view-front').click()
  },
  2() {
    $('btn-view-back').click()
  },
  3() {
    $('btn-view-top').click()
  },
  4() {
    $('btn-view-bottom').click()
  },
  5() {
    $('btn-view-right').click()
  },
  6() {
    $('btn-view-left').click()
  },
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  const handler = keyMap[e.key.toLowerCase()]
  if (handler) {
    e.preventDefault()
    handler(e)
  }
})

// ── Resize ─────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  const el = $('viewer')
  el.style.width = window.innerWidth + 'px'
  el.style.height = window.innerHeight + 'px'
  if (embeddedViewer) embeddedViewer.Resize()
})

// ── Init ───────────────────────────────────────────────────────────────

applyTheme()
updateModeUI()
updateWsUI()

window.addEventListener('load', () => {
  createViewer()
  loadInitialScene()
  connectWebSocket()
})
