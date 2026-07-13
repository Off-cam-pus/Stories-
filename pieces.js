/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - PIECES MODULE
 * ==========================================================================
 * Handles piece models generation, material color profiles, programmatic 
 * structural rendering, and precise transformations in 3D scene space.
 */

window.PiecesManager = (function () {
    // Array tracking all live 3D piece mesh instances in play
    const activePieces = [];

    // Colors mapping to Player teams
    const COLORS = {
        white: { primary: 0xf8fafc, specular: 0xffffff, roughness: 0.2, metalness: 0.1 },
        black: { primary: 0x1e293b, specular: 0x3b82f6, roughness: 0.4, metalness: 0.6 }
    };

    /**
     * Spawns a new 3D piece element using fallback high-fidelity procedural geometries
     * @param {string} type - 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
     * @param {string} team - 'white' | 'black'
     * @param {number} row - Grid layout row (0-7)
     * @param {number} col - Grid layout column (0-7)
     */
    function createPiece(type, team, row, col) {
        const scene = window.Board3D.getScene();
        if (!scene) return null;

        // 1. Create Composition Group
        const pieceGroup = new THREE.Group();
        pieceGroup.userData = { type, team, row, col, isPiece: true };

        // 2. Select Component Profiles
        const colorConfig = COLORS[team];
        const material = new THREE.MeshStandardMaterial({
            color: colorConfig.primary,
            roughness: colorConfig.roughness,
            metalness: colorConfig.metalness,
            bumpScale: 0.05
        });

        // 3. Assemble Procedural Geometry Parts
        buildProceduralMesh(type, material, pieceGroup);

        // 4. Orientation Adjustments
        if (team === 'black') {
            pieceGroup.rotation.y = Math.PI; // Face opposite direction
        }

        // 5. Position Assignments
        const worldPos = window.Board3D.getSquareWorldPosition(row, col);
        pieceGroup.position.copy(worldPos);

        // 6. Append to Environments
        scene.add(pieceGroup);
        activePieces.push(pieceGroup);

        return pieceGroup;
    }

    /**
     * Programmatic geometry modeling engine to build abstract archetypes
     */
    function buildProceduralMesh(type, material, group) {
        // Shared Base platform
        const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 16);
        const base = new THREE.Mesh(baseGeo, material);
        base.position.y = 0.075;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        switch (type) {
            case 'pawn': {
                const bodyGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.4, 16);
                const body = new THREE.Mesh(bodyGeo, material);
                body.position.y = 0.35;
                
                const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
                const head = new THREE.Mesh(headGeo, material);
                head.position.y = 0.6;

                body.castShadow = head.castShadow = true;
                group.add(body, head);
                break;
            }
            case 'rook': {
                const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.5, 16);
                const body = new THREE.Mesh(bodyGeo, material);
                body.position.y = 0.4;

                const topGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.2, 16);
                const top = new THREE.Mesh(topGeo, material);
                top.position.y = 0.7;

                body.castShadow = top.castShadow = true;
                group.add(body, top);
                break;
            }
            case 'knight': {
                const bodyGeo = new THREE.BoxGeometry(0.2, 0.5, 0.35);
                const body = new THREE.Mesh(bodyGeo, material);
                body.position.y = 0.4;

                const snoutGeo = new THREE.BoxGeometry(0.2, 0.2, 0.25);
                const snout = new THREE.Mesh(snoutGeo, material);
                snout.position.set(0, 0.55, 0.1);

                body.castShadow = snout.castShadow = true;
                group.add(body, snout);
                break;
            }
            case 'bishop': {
                const bodyGeo = new THREE.CylinderGeometry(0.15, 0.26, 0.6, 16);
                const body = new THREE.Mesh(bodyGeo, material);
                body.position.y = 0.45;

                const headGeo = new THREE.ConeGeometry(0.18, 0.3, 16);
                const head = new THREE.Mesh(headGeo, material);
                head.position.y = 0.8;

                body.castShadow = head.castShadow = true;
                group.add(body, head);
                break;
            }
            case 'queen': {
                const bodyGeo = new THREE.CylinderGeometry(0.16, 0.28, 0.7, 16);
                const body = new THREE.Mesh(bodyGeo, material);
                body.position.y = 0.5;

                const crownGeo = new THREE.CylinderGeometry(0.3, 0.18, 0.2, 16);
                const crown = new THREE.Mesh(crownGeo, material);
                crown.position.y = 0.9;

                body.castShadow = crown.castShadow = true;
                group.add(body, crown);
                break;
            }
            case 'king': {
                const bodyGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.75, 16);
                const body = new THREE.Mesh(bodyGeo, material);
                body.position.y = 0.525;

                const crossVertGeo = new THREE.BoxGeometry(0.08, 0.25, 0.08);
                const crossVert = new THREE.Mesh(crossVertGeo, material);
                crossVert.position.y = 1.0;

                const crossHorizGeo = new THREE.BoxGeometry(0.2, 0.08, 0.08);
                const crossHoriz = new THREE.Mesh(crossHorizGeo, material);
                crossHoriz.position.y = 1.03;

                body.castShadow = crossVert.castShadow = crossHoriz.castShadow = true;
                group.add(body, crossVert, crossHoriz);
                break;
            }
        }
    }

    /**
     * Returns the target piece mesh structure mapped to structural map grid indices
     */
    function getPieceAt(row, col) {
        return activePieces.find(p => p.userData.row === row && p.userData.col === col);
    }

    /**
     * Evicts piece instance from structural arrays and visual world arrays
     */
    function removePiece(pieceMesh) {
        if (!pieceMesh) return;
        const index = activePieces.indexOf(pieceMesh);
        if (index > -1) activePieces.splice(index, 1);

        const scene = window.Board3D.getScene();
        if (scene) scene.remove(pieceMesh);
    }

    /**
     * Wipes all structural references down cleanly for restarts
     */
    function clearAll() {
        const scene = window.Board3D.getScene();
        if (scene) {
            activePieces.forEach(piece => scene.remove(piece));
        }
        activePieces.length = 0;
    }

    // Module Exports
    return {
        createPiece: createPiece,
        getPieceAt: getPieceAt,
        removePiece: removePiece,
        clearAll: clearAll,
        getActivePieces: () => activePieces
    };
})();
      
