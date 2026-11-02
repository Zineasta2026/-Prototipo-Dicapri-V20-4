import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const COLORS = {
  turquoise: 0x0696a6,
  turquoiseDark: 0x066675,
  metal: 0xb9c7cf,
  darkMetal: 0x334653,
  rubber: 0x17232c,
  yellow: 0xf5c842,
  green: 0x22c55e,
  red: 0xef4444,
  yarn: 0xf7f2dd
}

export function initMachine3D(selector) {
  const container = document.querySelector(selector)
  if (!container) return null

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xeaf4f8)
  scene.fog = new THREE.Fog(0xeaf4f8, 12, 24)

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60)
  camera.position.set(7.4, 5.1, 9.5)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  container.prepend(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.07
  controls.target.set(0, 2.55, 0)
  controls.minDistance = 6
  controls.maxDistance = 17
  controls.maxPolarAngle = Math.PI * 0.49

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x78909c, 2.35)
  scene.add(hemisphere)
  const key = new THREE.DirectionalLight(0xffffff, 4.5)
  key.position.set(5, 10, 7)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -7
  key.shadow.camera.right = 7
  key.shadow.camera.top = 9
  key.shadow.camera.bottom = -3
  scene.add(key)

  const fill = new THREE.DirectionalLight(0x9fe7ff, 2)
  fill.position.set(-6, 4, 3)
  scene.add(fill)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 18),
    new THREE.MeshStandardMaterial({ color: 0xdce9ee, roughness: 0.88, metalness: 0.02 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const platform = roundedBox(5.4, 0.16, 4.1, 0xcedde4, 0.68)
  platform.position.y = 0.08
  platform.receiveShadow = true
  scene.add(platform)

  const machine = new THREE.Group()
  machine.rotation.y = -0.1
  scene.add(machine)

  const cabinetMaterial = material(COLORS.turquoise, 0.28, 0.58)
  const darkCabinetMaterial = material(COLORS.turquoiseDark, 0.3, 0.48)
  const metalMaterial = material(COLORS.metal, 0.78, 0.23)
  const darkMetalMaterial = material(COLORS.darkMetal, 0.72, 0.3)
  const rubberMaterial = material(COLORS.rubber, 0.1, 0.78)

  const body = roundedBox(2.35, 2.25, 1.8, COLORS.turquoise, 0.52)
  body.position.set(0, 1.27, 0)
  body.material = cabinetMaterial
  machine.add(body)

  const lowerDoor = roundedBox(1.82, 1.28, 0.055, COLORS.turquoiseDark, 0.55)
  lowerDoor.position.set(0, 1.02, 0.925)
  machine.add(lowerDoor)

  for (let index = 0; index < 8; index += 1) {
    const slot = roundedBox(0.72, 0.022, 0.025, 0x064b57, 0.82)
    slot.position.set(-0.48, 0.73 + index * 0.065, 0.965)
    machine.add(slot)
  }

  const consoleGroup = new THREE.Group()
  consoleGroup.position.set(0, 2.47, 0.58)
  consoleGroup.rotation.x = -0.3
  machine.add(consoleGroup)

  const consoleBody = roundedBox(2.24, 0.62, 1.1, COLORS.turquoiseDark, 0.42)
  consoleBody.material = darkCabinetMaterial
  consoleGroup.add(consoleBody)

  const display = roundedBox(0.75, 0.3, 0.025, 0x173342, 0.34)
  display.position.set(-0.46, 0.06, 0.565)
  display.material.emissive = new THREE.Color(0x0ea5e9)
  display.material.emissiveIntensity = 0.16
  consoleGroup.add(display)

  for (let index = 0; index < 4; index += 1) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.035, 20),
      material(index === 0 ? COLORS.red : index === 1 ? COLORS.green : 0xe2e8f0, 0.12, 0.35)
    )
    button.rotation.x = Math.PI / 2
    button.position.set(0.22 + index * 0.2, 0.04, 0.59)
    consoleGroup.add(button)
  }

  const headGroup = new THREE.Group()
  headGroup.position.set(0, 3.22, 0.05)
  machine.add(headGroup)

  const headBase = cylinder(0.92, 0.86, 0.42, metalMaterial)
  headBase.position.y = 0.05
  headGroup.add(headBase)

  const headRing = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.12, 16, 72), darkMetalMaterial)
  headRing.rotation.x = Math.PI / 2
  headRing.position.y = 0.28
  headGroup.add(headRing)

  const needleCylinder = cylinder(0.43, 0.43, 0.5, rubberMaterial, 48)
  needleCylinder.position.y = 0.42
  headGroup.add(needleCylinder)

  const needleRing = new THREE.Group()
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2
    const needle = roundedBox(0.035, 0.45, 0.035, 0xdce7eb, 0.18)
    needle.position.set(Math.cos(angle) * 0.52, 0.47, Math.sin(angle) * 0.52)
    needleRing.add(needle)
  }
  headGroup.add(needleRing)

  const feeders = new THREE.Group()
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2
    const feeder = new THREE.Group()
    const arm = roundedBox(0.06, 0.06, 0.75, 0xa6b7c0, 0.25)
    arm.position.z = 0.37
    feeder.add(arm)
    const tip = roundedBox(0.12, 0.18, 0.16, index % 2 ? 0xe2e8f0 : COLORS.yellow, 0.38)
    tip.position.set(0, -0.05, 0.73)
    feeder.add(tip)
    feeder.rotation.y = -angle + Math.PI / 2
    feeder.position.set(Math.cos(angle) * 0.58, 0.64, Math.sin(angle) * 0.58)
    feeders.add(feeder)
  }
  headGroup.add(feeders)

  const safetyRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.035, 10, 72),
    material(0xd7e1e6, 0.88, 0.18)
  )
  safetyRing.rotation.x = Math.PI / 2
  safetyRing.position.y = 0.84
  headGroup.add(safetyRing)

  const frame = new THREE.Group()
  machine.add(frame)
  ;[[-1.35, -0.75], [1.35, -0.75], [-1.35, 0.7], [1.35, 0.7]].forEach(([x, z]) => {
    const post = roundedBox(0.075, 3.4, 0.075, 0x9aaab2, 0.24)
    post.position.set(x, 4.75, z)
    frame.add(post)
  })

  ;[4.15, 5.35, 6.42].forEach((height, level) => {
    const frontBar = roundedBox(3.05, 0.075, 0.075, 0xa9b7be, 0.22)
    frontBar.position.set(0, height, 0.72)
    frame.add(frontBar)
    const rearBar = frontBar.clone()
    rearBar.position.z = -0.77
    frame.add(rearBar)
    if (level > 0) {
      const sideBar = roundedBox(0.075, 0.075, 1.55, 0xa9b7be, 0.22)
      sideBar.position.set(-1.34, height, 0)
      frame.add(sideBar)
      const otherSide = sideBar.clone()
      otherSide.position.x = 1.34
      frame.add(otherSide)
    }
  })

  const guideRotor = new THREE.Group()
  guideRotor.position.y = 5.65
  frame.add(guideRotor)
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2
    const spoke = roundedBox(0.045, 0.045, 1.55, 0xb6c2c8, 0.2)
    spoke.position.z = 0.77
    spoke.rotation.y = -angle + Math.PI / 2
    guideRotor.add(spoke)
    const guide = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.022, 8, 24),
      material(index % 2 ? 0xe7b22f : 0xc8d4d9, 0.55, 0.25)
    )
    guide.position.set(Math.cos(angle) * 1.52, 0, Math.sin(angle) * 1.52)
    guide.rotation.y = angle
    guideRotor.add(guide)
  }

  const yarnLines = []
  ;[-0.82, -0.28, 0.28, 0.82].forEach((x, index) => {
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.24, 0.55, 28),
      material(index % 2 ? 0xd8c6a0 : 0xf1ede2, 0.02, 0.85)
    )
    cone.position.set(x, 5.72, -0.55)
    frame.add(cone)

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 5.9, -0.55),
      new THREE.Vector3(x * 1.25, 5.55, 0.25),
      new THREE.Vector3(x * 0.78, 4.75, 0.35),
      new THREE.Vector3(x * 0.45, 4.03, 0.15),
      new THREE.Vector3(x * 0.25, 3.88, 0.05)
    ])
    const yarn = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 42, 0.012, 6, false),
      material(index === 2 ? 0xf0b429 : COLORS.yarn, 0.02, 0.82)
    )
    yarnLines.push(yarn)
    frame.add(yarn)
  })

  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.75, 3.55, -0.25),
    new THREE.Vector3(1.55, 3.75, -0.65),
    new THREE.Vector3(1.8, 2.65, -0.9),
    new THREE.Vector3(1.88, 1.65, -0.72)
  ])
  machine.add(new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 52, 0.16, 12, false),
    material(0xd9c66e, 0.02, 0.68)
  ))

  const collector = cylinder(0.44, 0.34, 1.55, darkMetalMaterial, 36)
  collector.position.set(1.92, 1.18, -0.72)
  machine.add(collector)
  const collectorCap = cylinder(0.5, 0.5, 0.16, rubberMaterial, 36)
  collectorCap.position.set(1.92, 1.98, -0.72)
  machine.add(collectorCap)

  const sensorLights = []
  ;[[-0.92, 3.92, 0.52], [0.9, 3.92, 0.5], [0, 2.66, 1.17]].forEach((position, index) => {
    const housing = roundedBox(0.24, 0.2, 0.18, 0x183b4a, 0.4)
    housing.position.set(...position)
    machine.add(housing)
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.047, 16, 12),
      new THREE.MeshStandardMaterial({ color: COLORS.green, emissive: COLORS.green, emissiveIntensity: 2.5 })
    )
    light.position.set(position[0], position[1], position[2] + (index === 2 ? 0.11 : 0.1))
    sensorLights.push(light)
    machine.add(light)
  })

  const statusLight = new THREE.PointLight(COLORS.green, 1.5, 2.5)
  statusLight.position.set(0, 3.7, 1.25)
  machine.add(statusLight)

  const operator = createOperator()
  operator.group.position.set(3.15, 0, 3.05)
  operator.group.rotation.y = -2.35
  operator.group.visible = false
  scene.add(operator.group)

  // V19: segundo personaje independiente, con casco blanco y chaleco naranja.
  const supervisor = createOperator()
  supervisor.group.position.set(-3.4, 0, 3.2)
  supervisor.group.visible = false
  supervisor.torso.traverse(node => {
    if (node.isMesh && node.material?.color) {
      if (node.material.color.getHex() === 0x176b87) node.material = material(0xf97316, 0.08, 0.65)
      if (node.material.color.getHex() === 0xfacc15 && node.geometry?.type === 'SphereGeometry') node.material = material(0xf8fafc, 0.08, 0.48)
    }
  })
  scene.add(supervisor.group)
  let supervisorActive = false
  let supervisorElapsed = 0
  let supervisorDuration = 0
  let supervisorStage = 'idle'

  machine.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  let rpm = 105
  let running = false
  let vibration = 1.8
  let operatorActive = false
  let operatorScenario = 'normal'
  let operatorElapsed = 0
  let operatorDuration = 0
  const clock = new THREE.Clock()

  function setTheme(theme = 'light') {
    const dark = theme === 'dark'
    const background = dark ? 0x071522 : 0xeaf4f8

    scene.background.setHex(background)
    scene.fog.color.setHex(background)
    floor.material.color.setHex(dark ? 0x102637 : 0xdce9ee)
    platform.material.color.setHex(dark ? 0x18384a : 0xcedde4)
    hemisphere.color.setHex(dark ? 0x9fdcff : 0xffffff)
    hemisphere.groundColor.setHex(dark ? 0x07111b : 0x78909c)
    hemisphere.intensity = dark ? 1.65 : 2.35
    key.intensity = dark ? 3.6 : 4.5
    fill.intensity = dark ? 1.45 : 2
    renderer.toneMappingExposure = dark ? 0.92 : 1.05
  }

  function setRPM(newRPM) {
    rpm = Math.max(0, Number(newRPM) || 0)
  }

  function setProcessState(next = {}) {
    running = Boolean(next.running)
    const scenario = next.scenario || 'normal'
    const threadPresent = next.threadPresent !== false
    vibration = Number(next.vibration) || 0

    const critical = [
      'brokenThread',
      'jam',
      'brokenNeedle',
      'elasticTrigger'
    ].includes(scenario)
    const warning = !critical && scenario !== 'normal'
    const color = critical ? COLORS.red : warning ? COLORS.yellow : COLORS.green
    sensorLights.forEach(light => {
      light.material.color.setHex(color)
      light.material.emissive.setHex(color)
    })
    statusLight.color.setHex(color)
    statusLight.intensity = running ? 1.8 : 0.4
    yarnLines.forEach(line => { line.visible = threadPresent })

    const status = document.querySelector('#machine3dState')
    const badge = document.querySelector('#machine3dLive')
    if (status) status.textContent = !running ? 'En espera' : critical ? 'Anomalía detectada' : warning ? 'Condición en observación' : 'Producción estable'
    if (badge) badge.dataset.state = critical ? 'critical' : warning ? 'warning' : running ? 'running' : 'idle'
  }

  function startIntervention(scenario = 'normal', durationSeconds = 0) {
    operatorActive = true
    operatorScenario = scenario
    operatorElapsed = 0
    operatorDuration = Math.max(0, Number(durationSeconds) || 0)
    operator.group.position.set(3.15, 0, 3.05)
    operator.group.rotation.y = -2.35
    operator.torso.rotation.set(0, 0, 0)
    operator.leftArm.rotation.set(0, 0, 0)
    operator.rightArm.rotation.set(0, 0, 0)
    operator.leftLeg.rotation.set(0, 0, 0)
    operator.rightLeg.rotation.set(0, 0, 0)
    operator.group.visible = true
    const interventionLabels = {
      brokenThread: 'Operario: reenhebrado del hilo',
      brokenNeedle: 'Operario: cambio de aguja',
      jam: 'Operario: retiro del atascamiento',
      elasticTrigger: 'Operario: ajuste del elástico',
      oilStain: 'Operario: limpieza e inspección',
      lowTension: 'Operario: regulación de tensión',
      highTension: 'Operario: regulación de tensión'
    }
    const status = document.querySelector('#machine3dState')
    const badge = document.querySelector('#machine3dLive')
    if (status) {
      status.textContent = interventionLabels[scenario] || 'Operario interviniendo'
    }
    if (badge) badge.dataset.state = 'warning'
  }

  function stopIntervention() {
    operatorActive = false
    operatorElapsed = 0
    operatorDuration = 0
    operator.group.visible = false
    operator.torso.rotation.set(0, 0, 0)
    operator.leftArm.rotation.set(0, 0, 0)
    operator.rightArm.rotation.set(0, 0, 0)
  }

  function startSupervisorIntervention(durationSeconds = 9) {
    supervisorActive = true
    supervisorElapsed = 0
    supervisorDuration = Math.max(4, Number(durationSeconds) || 9)
    supervisorStage = 'walking'
    supervisor.group.position.set(-3.4, 0, 3.2)
    supervisor.group.visible = true
    const status = document.querySelector('#machine3dState')
    if (status) status.textContent = 'Jefe de planta: evaluación especializada'
  }

  function stopSupervisorIntervention() {
    supervisorActive = false
    supervisorStage = 'idle'
    supervisor.group.visible = false
  }

  function resize() {
    const width = Math.max(container.clientWidth, 320)
    const height = Math.max(container.clientHeight, 420)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  new ResizeObserver(resize).observe(container)
  resize()

  function animate() {
    requestAnimationFrame(animate)
    const delta = Math.min(clock.getDelta(), 0.04)
    const speed = running ? rpm * delta * 0.008 : 0
    needleRing.rotation.y += speed
    feeders.rotation.y += speed * 0.32
    guideRotor.rotation.y += speed * 0.035
    statusLight.intensity += Math.sin(performance.now() * 0.006) * 0.012

    if (running && vibration > 5) {
      machine.position.x = Math.sin(performance.now() * 0.04) * 0.012
    } else {
      machine.position.x *= 0.8
    }


    if (operatorActive) {
      operatorElapsed += delta
      const startPosition = new THREE.Vector3(3.15, 0, 3.05)
      const workPositions = {
        brokenNeedle: new THREE.Vector3(1.18, 0, 1.28),
        brokenThread: new THREE.Vector3(1.12, 0, 1.38),
        jam: new THREE.Vector3(1.28, 0, 1.2),
        elasticTrigger: new THREE.Vector3(1.05, 0, 1.42),
        oilStain: new THREE.Vector3(1.2, 0, 1.35),
        lowTension: new THREE.Vector3(1.02, 0, 1.48),
        highTension: new THREE.Vector3(1.02, 0, 1.48)
      }
      const workPosition = workPositions[operatorScenario] ||
        new THREE.Vector3(1.18, 0, 1.35)
      const walkTime = operatorDuration > 0
        ? Math.max(1.1, operatorDuration * 0.24)
        : 1.4
      const exitTime = operatorDuration > 0
        ? Math.max(0, operatorDuration - 1.2)
        : Infinity

      if (operatorElapsed < walkTime) {
        const progress = THREE.MathUtils.smoothstep(operatorElapsed / walkTime, 0, 1)
        operator.group.position.lerpVectors(startPosition, workPosition, progress)
        operator.group.rotation.y = THREE.MathUtils.lerp(-2.35, -2.42, progress)
        const stride = Math.sin(operatorElapsed * 8) * 0.48
        operator.leftLeg.rotation.x = stride
        operator.rightLeg.rotation.x = -stride
        operator.leftArm.rotation.x = -stride * 0.65
        operator.rightArm.rotation.x = stride * 0.65
      } else if (operatorElapsed < exitTime) {
        operator.group.position.copy(workPosition)
        operator.group.rotation.y = -2.42
        operator.leftLeg.rotation.x *= 0.78
        operator.rightLeg.rotation.x *= 0.78
        // V20: posturas específicas de inspección, ajuste y limpieza (animación procedural).
        const elapsedWork = operatorElapsed - walkTime
        const isNeedle = operatorScenario === 'brokenNeedle'
        const isTension = ['lowTension', 'highTension'].includes(operatorScenario)
        const isOil = operatorScenario === 'oilStain'
        const isThread = operatorScenario === 'brokenThread'
        const frequency = isOil ? 5 : isNeedle ? 3.2 : isTension ? 4 : 3.5
        const pulse = Math.sin(elapsedWork * frequency)
        const inspectPhase = elapsedWork < 1.3
        operator.torso.rotation.x = inspectPhase ? 0.22 : isNeedle ? 0.30 : isOil ? 0.32 : 0.17
        operator.torso.rotation.z = isNeedle ? 0.08 : isTension ? -0.06 : 0
        operator.rightArm.rotation.x = inspectPhase ? -0.45 : isNeedle ? -1.35 + pulse * 0.10 : isTension ? -0.95 + pulse * 0.22 : isOil ? -1.12 + pulse * 0.26 : -1.1 + pulse * 0.16
        operator.leftArm.rotation.x = inspectPhase ? -0.20 : isThread ? -1.22 + Math.sin(elapsedWork * 2.2) * 0.12 : -0.67 + pulse * 0.07
        operator.rightArm.rotation.z = isNeedle ? -0.32 : isTension ? -0.22 : -0.14
        operator.leftArm.rotation.z = isThread ? 0.35 : 0.17
        operator.leftLeg.rotation.x = isNeedle ? 0.11 : 0
        operator.rightLeg.rotation.x = isNeedle ? -0.09 : 0
      } else {
        const progress = THREE.MathUtils.smoothstep(
          (operatorElapsed - exitTime) / Math.max(0.8, operatorDuration - exitTime),
          0,
          1
        )
        operator.group.position.lerpVectors(workPosition, startPosition, progress)
        operator.group.rotation.y = THREE.MathUtils.lerp(-2.42, 0.78, progress)
        const stride = Math.sin(operatorElapsed * 8) * 0.44
        operator.leftLeg.rotation.x = stride
        operator.rightLeg.rotation.x = -stride
        operator.leftArm.rotation.x = -stride * 0.6
        operator.rightArm.rotation.x = stride * 0.6
        operator.leftArm.rotation.z *= 0.75
        operator.rightArm.rotation.z *= 0.75
        operator.torso.rotation.x *= 0.75
      }
    }

    if (supervisorActive) {
      supervisorElapsed += delta
      const start = new THREE.Vector3(-3.4, 0, 3.2)
      const target = new THREE.Vector3(-1.55, 0, 1.55)
      const approach = Math.min(2.4, supervisorDuration * 0.3)
      const leaveAt = supervisorDuration - 1.4
      if (supervisorElapsed < approach) {
        supervisorStage = 'walking'
        const t = THREE.MathUtils.smoothstep(supervisorElapsed / approach, 0, 1)
        supervisor.group.position.lerpVectors(start, target, t)
        supervisor.group.rotation.y = -1.5
        const stride = Math.sin(supervisorElapsed * 8) * 0.4
        supervisor.leftLeg.rotation.x = stride
        supervisor.rightLeg.rotation.x = -stride
      } else if (supervisorElapsed < leaveAt) {
        supervisorStage = 'inspecting'
        supervisor.group.position.copy(target)
        supervisor.group.rotation.y = -1.52 + Math.sin(supervisorElapsed * 1.1) * 0.07
        supervisor.leftLeg.rotation.x = 0
        supervisor.rightLeg.rotation.x = 0
        // El jefe inspecciona, señala el componente y consulta parámetros;
        // no repite el gesto de reparación del operario.
        const timeInspecting = supervisorElapsed - approach
        const pointing = timeInspecting > 1.3 && timeInspecting < 3.8
        supervisor.torso.rotation.x = pointing ? 0.18 : 0.08
        supervisor.torso.rotation.z = pointing ? -0.10 : 0
        supervisor.rightArm.rotation.x = pointing ? -1.30 : -0.45
        supervisor.rightArm.rotation.z = pointing ? -0.30 : -0.08
        supervisor.leftArm.rotation.x = pointing ? -0.25 : -0.85
        supervisor.leftArm.rotation.z = pointing ? 0.14 : 0.30
      } else if (supervisorElapsed < supervisorDuration) {
        supervisorStage = 'returning'
        const t = THREE.MathUtils.smoothstep((supervisorElapsed - leaveAt) / 1.4, 0, 1)
        supervisor.group.position.lerpVectors(target, start, t)
        supervisor.leftLeg.rotation.x = Math.sin(supervisorElapsed * 8) * 0.4
        supervisor.rightLeg.rotation.x = -supervisor.leftLeg.rotation.x
      } else {
        stopSupervisorIntervention()
      }
    }

    controls.update()
    renderer.render(scene, camera)
  }

  animate()
  setProcessState()
  return {
    setRPM,
    setProcessState,
    startIntervention,
    stopIntervention,
    startSupervisorIntervention,
    stopSupervisorIntervention,
    setTheme
  }
}

function createOperator() {
  const group = new THREE.Group()
  const torso = new THREE.Group()
  torso.position.y = 1.18
  group.add(torso)

  const uniform = material(0x176b87, 0.08, 0.68)
  const uniformDark = material(0x123f56, 0.1, 0.72)
  const skin = material(0xb97850, 0.02, 0.82)
  const boot = material(0x1f2937, 0.05, 0.78)
  const helmet = material(0xfacc15, 0.12, 0.48)

  const chest = roundedBox(0.52, 0.72, 0.28, 0x176b87, 0.68)
  chest.material = uniform
  torso.add(chest)

  const safetyStripe = roundedBox(0.55, 0.1, 0.012, 0xfacc15, 0.42)
  safetyStripe.position.set(0, 0.02, 0.148)
  torso.add(safetyStripe)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 18), skin)
  head.position.y = 0.57
  torso.add(head)

  const hardHat = new THREE.Mesh(
    new THREE.SphereGeometry(0.205, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    helmet
  )
  hardHat.position.y = 0.65
  torso.add(hardHat)

  const createLimb = (x, y, length, limbMaterial) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, y, 0)
    const limb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.075, length, 14),
      limbMaterial
    )
    limb.position.y = -length / 2
    pivot.add(limb)
    return pivot
  }

  const leftArm = createLimb(-0.34, 0.25, 0.62, uniform)
  const rightArm = createLimb(0.34, 0.25, 0.62, uniform)
  torso.add(leftArm, rightArm)

  const leftLeg = createLimb(-0.15, 0.84, 0.82, uniformDark)
  const rightLeg = createLimb(0.15, 0.84, 0.82, uniformDark)
  group.add(leftLeg, rightLeg)

  ;[leftLeg, rightLeg].forEach(leg => {
    const shoe = roundedBox(0.14, 0.1, 0.27, 0x1f2937, 0.78)
    shoe.material = boot
    shoe.position.set(0, -0.82, 0.06)
    leg.add(shoe)
  })

  group.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  return { group, torso, leftArm, rightArm, leftLeg, rightLeg }
}

function material(color, metalness = 0.2, roughness = 0.5) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness })
}

function roundedBox(width, height, depth, color, roughness = 0.5) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth, 2, 2, 2),
    material(color, 0.22, roughness)
  )
}

function cylinder(radiusTop, radiusBottom, height, meshMaterial, segments = 36) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    meshMaterial
  )
}
