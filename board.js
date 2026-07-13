/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - BOARD MODULE
 * ==========================================================================
 * Manages the Three.js 3D viewport, scene construction, lighting rigs,
 * and 3D-to-2D grid transformations.
 */

window.Board3D = (function () {
    // Private Module State
    let scene, camera, renderer, controls;
    let boardContainer;
    const squares = []; // Maps 1D grid space to 3D Mesh references

    // Configurable Theme Palette Map
    const THEMES = {
        classic: { dark: 0x5d4037, light: 0xd7ccc8, border: 0x3e2723, ambient: 0xffffff },
        marble:  { dark: 0x475569, light: 0xf1f5f9, border: 0x1e293b, ambient: 0xe2e8f0 },
        neon:    { dark: 0x0f172a, light: 0x06b6d4, border: 0x020617, ambient: 0x67e8f9 }
    };

    let currentTheme = 'classic';

    /**
     * Initializes the Three.js environment inside the container
     */
    function init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. Scene Setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x121214);

        // 2. Camera Setup
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        // Default viewpoint positioned looking from White player's angle
        camera.position.set(0, 10, 8);

        // 3. Renderer Setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // 4. Controls Setup (OrbitControls for user camera panning)
        if (window.THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going under board
            controls.minDistance = 4;
            controls.maxDistance = 20;
        }

        // 5. Build Infrastructure Setup
        boardContainer = new THREE.Group();
        scene.add(boardContainer);
        
        setupLighting();
        buildPhysicalBoard();

        // 6. Viewport Resize Binding
        window.addEventListener('resize', handleWindowResize);

        // Kick off engine cycle
        animate();
    }

    /**
     * Creates and attaches environmental light configurations
     */
    function setupLighting() {
        const ambientLight = new THREE.AmbientLight(THEMES[currentTheme].ambient, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 12, 4);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 25;
        dirLight.shadow.camera.left = -6;
        dirLight.shadow.camera.right = 6;
        dirLight.shadow.camera.top = 6;
        dirLight.shadow.camera.bottom = -6;
        dirLight.shadow.bias = -0.0005;
        scene.add(dirLight);
    }

    /**
     * Generates the physical components of the 8x8 checkerboard grid
     */
    function buildPhysicalBoard() {
        const theme = THEMES[currentTheme];
        const squareSize = 1;
        const thickness = 0.2;

        // Base Board Frame
        const frameGeo = new THREE.BoxGeometry(8.5, thickness, 8.5);
        const frameMat = new THREE.MeshStandardMaterial({ color: theme.border, roughness: 0.5 });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.y = -thickness / 2;
        frameMesh.receiveShadow = true;
        boardContainer.add(frameMesh);

        // Grid Loop
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isLight = (row + col) % 2 === 1;
                const squareGeo = new THREE.BoxGeometry(squareSize, 0.02, squareSize);
                const squareMat = new THREE.MeshStandardMaterial({
                    color: isLight ? theme.light : theme.dark,
                    roughness: 0.3,
                    metalness: currentTheme === 'neon' ? 0.2 : 0.0
                });

                const squareMesh = new THREE.Mesh(squareGeo, squareMat);
                // Offset calculation to align center center-mass on (0,0,0)
                squareMesh.position.set(col - 3.5, 0, row - 3.5);
                squareMesh.receiveShadow = true;
                
                // Stash index reference pointers inside the mesh data footprint for raycasting hooks
                squareMesh.userData = { row, col, isSquare: true };

                boardContainer.add(squareMesh);
                squares.push(squareMesh);
            }
        }
    }

    /**
     * Redraws colors of architectural elements dynamically on configuration updates
     */
    function updateTheme(themeName) {
        if (!THEMES[themeName]) return;
        currentTheme = themeName;

        // Wipe board container elements down and reconstruct 
        while(boardContainer.children.length > 0){
            boardContainer.remove(boardContainer.children[0]);
        }
        squares.length = 0;
        
        buildPhysicalBoard();
    }

    /**
     * Engine loop updates controls updates and processes canvas render loops
     */
    function animate() {
        requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) renderer.render(scene, camera);
    }

    function handleWindowResize() {
        const container = renderer.domElement.parentElement;
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /**
     * Maps global Matrix space coordinates (row, col) to real World Vector3 positions
     */
    function getSquareWorldPosition(row, col) {
        return new THREE.Vector3(col - 3.5, 0, row - 3.5);
    }

    // Module Exports
    return {
        init: init,
        updateTheme: updateTheme,
        getSquareWorldPosition: getSquareWorldPosition,
        getScene: () => scene,
        getCamera: () => camera,
        getSquares: () => squares
    };
})();
  
