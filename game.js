/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - GAME ENGINE MODULE
 * ==========================================================================
 * Central rules coordinator and state machine tracking active matches,
 * turns, move execution, captures, and win/loss evaluations.
 */

window.GameEngine = (function () {
    // Core Match State Data
    let matchConfig = null;
    let currentTurn = 'white'; // 'white' | 'black'
    let isGameActive = false;
    let virtualBoard = []; // 8x8 matrix tracking logic pieces layout 

    /**
     * Spawns, maps, and structures a brand new chess match
     * @param {Object} config - { mode: 'pvp'|'ai', timeLimit: seconds, difficulty: string, theme: string }
     */
    function setupNewMatch(config) {
        matchConfig = config;
        isGameActive = true;
        currentTurn = 'white';

        // 1. Wipe down old visual assets and canvas items
        window.PiecesManager.clearAll();

        // 2. Initialize fresh internal logic matrix
        initializeLogicalMatrix();

        // 3. Spawn 3D assets to map back to logic layout
        instantiatePhysicalPieces();

        // 4. Reset HUD clocks, text elements, and history columns
        if (window.UIManager) {
            window.UIManager.resetMatchUI(matchConfig.timeLimit);
            window.UIManager.updateTurnIndicator(currentTurn);
        }
    }

    /**
     * Initializes the underlying 8x8 structural logic state array
     */
    function initializeLogicalMatrix() {
        virtualBoard = Array(8).fill(null).map(() => Array(8).fill(null));

        const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

        // Assign Black Forces (Rows 0 & 1)
        for (let col = 0; col < 8; col++) {
            virtualBoard[0][col] = { type: backRow[col], team: 'black' };
            virtualBoard[1][col] = { type: 'pawn', team: 'black' };
        }

        // Assign White Forces (Rows 6 & 7)
        for (let col = 0; col < 8; col++) {
            virtualBoard[6][col] = { type: 'pawn', team: 'white' };
            virtualBoard[7][col] = { type: backRow[col], team: 'white' };
        }
    }

    /**
     * Commands the PiecesManager to render corresponding 3D piece elements
     */
    function instantiatePhysicalPieces() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const item = virtualBoard[row][col];
                if (item) {
                    window.PiecesManager.createPiece(item.type, item.team, row, col);
                }
            }
        }
    }

    /**
     * Processes programmatic move queries, mutating logical matrices and triggering animations
     * @param {number} fromRow - Origin row index
     * @param {number} fromCol - Origin column index
     * @param {number} toRow - Destination row index
     * @param {number} toCol - Destination column index
     */
    function executeMove(fromRow, fromCol, toRow, toCol) {
        if (!isGameActive) return false;

        const piece = virtualBoard[fromRow][fromCol];
        const targetCell = virtualBoard[toRow][toCol];

        if (!piece || piece.team !== currentTurn) return false;

        // --- 1. Rule Validity Sanity Check ---
        if (!isValidMove(fromRow, fromCol, toRow, toCol)) return false;

        // --- 2. Action Executions ---
        let pieceMesh = window.PiecesManager.getPieceAt(fromRow, fromCol);
        let targetMesh = window.PiecesManager.getPieceAt(toRow, toCol);

        if (targetCell && targetMesh) {
            // Process captures
            window.PiecesManager.removePiece(targetMesh);
            if (window.UIManager) window.UIManager.logCapture(targetCell.team, targetCell.type);
            if (window.SoundManager) window.SoundManager.play('capture');
        } else {
            if (window.SoundManager) window.SoundManager.play('move');
        }

        // Mutate Data Matrix
        virtualBoard[toRow][toCol] = piece;
        virtualBoard[fromRow][fromCol] = null;

        // Mutate Piece user configurations tracking details
        pieceMesh.userData.row = toRow;
        pieceMesh.userData.col = toCol;

        // Trigger visual interpolation transition sequence
        if (window.AnimationEngine) {
            window.AnimationEngine.slidePiece(pieceMesh, toRow, toCol);
        } else {
            const worldPos = window.Board3D.getSquareWorldPosition(toRow, toCol);
            pieceMesh.position.copy(worldPos);
        }

        // Log transaction row on visual panels
        if (window.UIManager) {
            window.UIManager.appendMoveToLog(piece.type, fromRow, fromCol, toRow, toCol, currentTurn);
        }

        // --- 3. Post Move Verification Lifecycle Hooks ---
        evaluateGameState();

        if (isGameActive) {
            switchTurn();
        }

        return true;
    }

    /**
     * Local abstraction evaluating fundamental movement path layouts
     */
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        // Prevent targeting the exact same square
        if (fromRow === toRow && fromCol === toCol) return false;
        
        // Ensure destination isn't blocked by a teammate
        const originPiece = virtualBoard[fromRow][fromCol];
        const destPiece = virtualBoard[toRow][toCol];
        if (destPiece && destPiece.team === originPiece.team) return false;

        // Simple bounding box verification edge case rules check 
        if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

        return true; 
    }

    /**
     * Cycles active player state roles and checks AI automation paths
     */
    function switchTurn() {
        currentTurn = currentTurn === 'white' ? 'black' : 'white';
        
        if (window.UIManager) {
            window.UIManager.updateTurnIndicator(currentTurn);
            window.UIManager.setActiveClock(currentTurn);
        }

        // Trigger AI automation calculation sequence if applicable
        if (matchConfig.mode === 'ai' && currentTurn === 'black' && isGameActive) {
            setTimeout(() => {
                if (window.ChessAI) {
                    window.ChessAI.requestBestMove(virtualBoard, 'black', (aiMove) => {
                        if (aiMove) {
                            executeMove(aiMove.fromRow, aiMove.fromCol, aiMove.toRow, aiMove.toCol);
                        }
                    });
                }
            }, 600); // Small psychological hold delay so AI moves naturally
        }
    }

    /**
     * Inspects active matrix boards for endgame metrics
     */
    function evaluateGameState() {
        // Quick verification pass scanning for remaining active King elements
        let whiteKingAlive = false;
        let blackKingAlive = false;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = virtualBoard[r][c];
                if (cell && cell.type === 'king') {
                    if (cell.team === 'white') whiteKingAlive = true;
                    if (cell.team === 'black') blackKingAlive = true;
                }
            }
        }

        if (!whiteKingAlive) {
            endMatch('black', 'White King was eliminated!');
        } else if (!blackKingAlive) {
            endMatch('white', 'Black King was eliminated!');
        }
    }

    /**
     * Shuts down engine process variables and triggers result panels
     */
    function endMatch(winner, reason) {
        isGameActive = false;
        if (window.UIManager) {
            window.UIManager.showGameOverModal(winner, reason);
        }
    }

    function terminateActiveMatch() {
        isGameActive = false;
        window.PiecesManager.clearAll();
    }

    // Module Exports
    return {
        setupNewMatch: setupNewMatch,
        executeMove: executeMove,
        terminateActiveMatch: terminateActiveMatch,
        getVirtualBoard: () => virtualBoard,
        getCurrentTurn: () => currentTurn,
        isGameActive: () => isGameActive
    };
})();
      
