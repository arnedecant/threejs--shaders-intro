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

	}

	createCamera() {

		// set values to init the camera
		this.aspectRatio = this.width / this.height
		this.fieldOfView = 60
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
			alpha: true,
			antialias: true
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

		this.vShader = document.querySelector('#vertexshader').textContent,
		this.fShader = document.querySelector('#fragmentshader').textContent
		
		// let uniforms = {
		// 	amplitude: {
		// 		type: 'f', 		// a float
		// 		value: 0		// value "0"
		// 	}
		// };

		this.geometry = new THREE.SphereBufferGeometry(100,16,16)

		this.material = new THREE.ShaderMaterial({
			// uniforms: uniforms,
			vertexShader: this.vShader,
		    fragmentShader: this.fShader
		})

		this.displacement = new Float32Array(this.geometry.attributes.position.count)
		this.noise = new Float32Array(this.geometry.attributes.position.count)

		for (let i = 0; i < this.displacement.length; i++) {
			this.noise[i] = Math.random() * 5;
		}

		this.geometry.addAttribute('displacement', new THREE.BufferAttribute(this.displacement, 1))

		this.mesh = new THREE.Mesh(this.geometry, this.material)
		
		this.scene.add(this.mesh)
		

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

	render() {

		let time = Date.now() * 0.01
		this.mesh.rotation.y = this.mesh.rotation.z = 0.01 * time

		// render
  		this.renderer.render(this.scene, this.camera);

		// add self to the requestAnimationFrame
		window.requestAnimationFrame(this.render.bind(this))

	}

}
