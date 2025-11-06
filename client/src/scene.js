import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import Stats from "three/examples/jsm/libs/stats.module.js"
import { config } from "./config.js"

export function createScene(canvas) {
    //generates scene objects
    const stats = new Stats()
    document.body.appendChild(stats.dom)

    const scene = new THREE.Scene()

    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    const aspect = sizes.width / sizes.height
    const camera = new THREE.OrthographicCamera( //generates orthographic camera you can probably figure out the rest
        (config.frustumSize * aspect) / -2,
        (config.frustumSize * aspect) / 2,
        config.frustumSize / 2,
        config.frustumSize / -2,
        0.1,
        1000
    )
    camera.position.set(0, 30, 0)
    camera.lookAt(0, 0, 0)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    const renderer = new THREE.WebGLRenderer({ canvas })
    renderer.setSize(sizes.width, sizes.height)

    const controls = new OrbitControls(camera, canvas)
    controls.enableRotate = false
    controls.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    }
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minZoom = 0.1
    controls.maxZoom = 10
    controls.panSpeed = 1.0

    const raycaster = new THREE.Raycaster()

    window.addEventListener("resize", () => {
        // event listener listening in on window resize to change the camera and renderer dimensions
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight
        camera.left = (config.frustumSize * sizes.width) / sizes.height / -2
        camera.right = (config.frustumSize * sizes.width) / sizes.height / 2
        camera.top = config.frustumSize / 2
        camera.bottom = config.frustumSize / -2
        camera.updateProjectionMatrix()
        renderer.setSize(sizes.width, sizes.height)
    })

    window.addEventListener("dblclick", () => {
        //adds an event listener that on double click toggles fullscreen. need to remove this probably its annoying
        if (!document.fullscreenElement) {
            canvas.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    })

    return { scene, camera, renderer, controls, raycaster, stats }
}
