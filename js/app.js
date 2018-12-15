'use strict'

class App {

	constructor(config) {

		// set properties
		this.config = {
			debug: config ? config.debug || false : false,
			camera: {
				default: {
					x: 0,
					y: 0,
					z: 300
				}
			}
		}

		this.zoom = config ? config.zoom || 1 : 1

		this.colors = {
			black: 0x23190f,
			brown: 0x59332e,
			red: 0xf25346,
			orange: 0xF5986E,
			blue: 0x68c3c0,
			white: 0xd8d0d1
		}

		this.mouse = {
			x: 0,
			y: 0
		}

		// init
		this.init()

	}

	init() {

		// check if WebGL is available
		// if (WEBGL.isWebGLAvailable() === false) {
		// 	document.body.appendChild(WEBGL.getWebGLErrorMessage());
		// }

		// skip if there's no THREE
		if (!THREE) return

		// set up scene, camera and renderer
		this.createScene()

		// add lights
		this.createLights()

		// add objects
		this.createObject()

		// add events
		window.addEventListener('resize', this.resize.bind(this), false)
		document.body.addEventListener('keydown', this.keydown.bind(this), false)

		// render
		this.render()

	}

	createScene() {

		// set width & height
		this.height = window.innerHeight
		this.width = window.innerWidth

		// create new scene
		this.scene = new THREE.Scene()

		// add fog to the scene
		this.scene.fog = new THREE.Fog(0xf7d9aa, 100, 950)

		// add background color
		this.scene.background = new THREE.Color(0x111111)

		// create the camera
		this.createCamera()

		// create the renderer
		this.createRenderer()

		// add debug helpers
		if (this.config.debug) initDebug()

	}

	initDebug() {

		let axesHelper = new THREE.AxesHelper(5)
		this.scene.add(axesHelper)

		let stats = new Stats()
		this.container.appendChild(stats.dom)

	}

	createCamera() {

		// set values to init the camera
		this.aspectRatio = this.width / this.height
		this.fieldOfView = 30
		this.nearPlane = 1
		this.farPlane = 10000

		// create a new camera
		this.camera = new THREE.PerspectiveCamera(
			this.fieldOfView,
			this.aspectRatio,
			this.nearPlane,
			this.farPlane
		)

		// set camera position
		this.camera.position.x = this.config.camera.default.x
		this.camera.position.y = this.config.camera.default.y
		this.camera.position.z = this.config.camera.default.z

	}

	createRenderer() {

		// create new renderer
		this.renderer = new THREE.WebGLRenderer({
			// alpha: true,
			// antialias: true
		})

		// set the size
		this.renderer.setSize(this.width, this.height)

		// enable shadowMap
		this.renderer.shadowMap.enabled = true

		// support for HDPI displays
		this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1)

		// append to DOM
		this.container = document.querySelector('#world')
		this.container.appendChild(this.renderer.domElement)

	}

	createLights() {

		// create a new hemisphere light (a gradient colored light)
		this.hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9)

		// create a new directional light (a light that shines from a specific direction)
		this.shadowLight = new THREE.DirectionalLight(0xffffff, 0.9)

		// create a new ambient light (a light that modifies the global color of a scene and makes the shadows softer)
		this.ambientLight = new THREE.AmbientLight(0xdc8874, 0.3)

		// set the direction of the light
		this.shadowLight.position.set(150, 350, 350)

		// allow shadow casting
		this.shadowLight.castShadow = true

		// set visible area of the projected shadow
		this.shadowLight.shadow.camera.left = -400;
		this.shadowLight.shadow.camera.right = 400;
		this.shadowLight.shadow.camera.top = 400;
		this.shadowLight.shadow.camera.bottom = -400;
		this.shadowLight.shadow.camera.near = 1;
		this.shadowLight.shadow.camera.far = 1000;

		// set the resolution fo the shadow
		this.shadowLight.shadow.mapSize.width = 2048
		this.shadowLight.shadow.mapSize.height = 2048

		// add lights to the scene
		this.scene.add(this.hemisphereLight)
		this.scene.add(this.shadowLight)
		this.scene.add(this.ambientLight)

	}

	createObject() {

		let radius = 50, 
			segments = 128, 
			rings = 64

		let geometry = new THREE.SphereBufferGeometry(radius, segments, rings)

		this.uniforms = {
			amplitude: {
				value: 1.0 
			},
			color: {
				value: new THREE.Color(0x8855ff) 
			},
			texture: {
				value: new THREE.TextureLoader().load("assets/textures/water.jpg")
			}
		}

		this.uniforms.texture.value.wrapS = this.uniforms.texture.value.wrapT = THREE.RepeatWrapping;

		let material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: document.querySelector('#vertexshader').textContent,
			fragmentShader: document.querySelector('#fragmentshader').textContent
		})

		this.displacement = new Float32Array(geometry.attributes.position.count)
		this.noise = new Float32Array(geometry.attributes.position.count)

		for (let i = 0; i < this.displacement.length; i++) {
			this.noise[i] = Math.random() * 5
		}

		geometry.addAttribute('displacement', new THREE.BufferAttribute(this.displacement, 1))

		this.sphere = new THREE.Mesh(geometry, material)

		this.scene.add(this.sphere)
		

	}

	resize(e) {

		// set canvas dimensions
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		// set renderer dimensions
		this.renderer.setSize(this.width, this.height)

		// set camera
		this.aspectRatio = this.width / this.height
		this.camera.aspect = this.aspectRatio
		this.camera.updateProjectionMatrix()

		// render
		// this.render()

	}

	keydown(e) {

		console.log('keydown: ', e)

		for (let i = 0; i < this.displacement.length; i++) {

			this.displacement[i] = Math.sin(0.1 * i + time)

			this.noise[i] += 0.5 * (0.5 - Math.random())
			this.noise[i] = THREE.Math.clamp(this.noise[i], -5, 5)

			this.displacement[i] += this.noise[i]
		}

		this.sphere.geometry.attributes.displacement.needsUpdate = true

	}

	render(timestamp) {

		let time = Date.now() * 0.01

		this.sphere.rotation.y = this.sphere.rotation.z = 0.01 * time

		this.uniforms.amplitude.value = 15 * Math.sin(this.sphere.rotation.y * 0.125)

		this.uniforms.color.value.offsetHSL(0.0005, 0, 0)

		for (let i = 0; i < this.displacement.length; i++) {

			this.displacement[i] = Math.sin(0.1 * i + time)

			this.noise[i] += 0.5 * (0.5 - Math.random())
			this.noise[i] = THREE.Math.clamp(this.noise[i], -5, 5)

			this.displacement[i] += this.noise[i]
		}

		this.sphere.geometry.attributes.displacement.needsUpdate = true

		// render
  		this.renderer.render(this.scene, this.camera)

		// add self to the requestAnimationFrame
		window.requestAnimationFrame(this.render.bind(this))

	}

}
