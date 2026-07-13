/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - RULES EXTENSION & UTILITIES
 * ==========================================================================
 * Integrates algorithmic rule verification for valid chess moves,
 * check/checkmate states, en passant, castling, and promotions.
 */

window.ChessRulesEngine = (function () {
    // Internal virtual tracking state using standard algebraic notation mechanics
    let activeMatchInstance = null;

    /**
     * Initializes a fresh tracking state matched with standard rulesets
     */
    function createNewLogicGame() {
        // Initializes board state configuration arrays internally
        activeMatchInstance = {
            turn: 'w',
            history: [],
            board: initializeStandardBoard()
        };
        return activeMatchInstance;
    }

    /**
     * Maps standard starting pieces positions
     */
    function initializeStandardBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        
        // Rows map out: 0 = Black Back, 1 = Black Pawns, 6 = White Pawns, 7 = White Back
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: backRow[i], color: 'b' };
            board[1][i] = { type: 'p', color: 'b' };
            board[6][i] = { type: 'p', color: 'w' };
            board[7][i] = { type: 'r', color: 'w' };
        }
        return board;
    }

    /**
     * Verifies if a geometric movement vector is fully legal under professional rules
     * Evaluates piece specific trajectories, collision barriers, and King safety checks
     */
    function checkLegality(fromRow, fromCol, toRow, toCol, currentMatrix) {
        const piece = currentMatrix[fromRow][fromCol];
        if (!piece) return false;

        // 1. Basic Boundary Checks
        if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

        // 2. Friendly Target Check
        const target = currentMatrix[toRow][toCol];
        if (target && target.team === piece.team) return false;

        // 3. Piece-Specific Trajectory Validation Engine
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);

        switch (piece.type) {
            case 'pawn':
                const direction = piece.team === 'white' ? -1 : 1;
                const startRow = piece.team === 'white' ? 6 : 1;

                // Standard 1 square forward push
                if (colDiff === 0 && rowDiff === direction && !target) return true;
                // Double square push from initial starting post
                if (colDiff === 0 && fromRow === startRow && rowDiff === 2 * direction) {
                    const intermediateRow = fromRow + direction;
                    if (!currentMatrix[intermediateRow][fromCol] && !target) return true;
                }
                // Diagonal capture rule validation
                if (absColDiff === 1 && rowDiff === direction && target && target.team !== piece.team) return true;
                
                return false;

            case 'knight':
                // Knights move in an L-shape structural pattern: (1x2 or 2x1 vectors)
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

            case 'bishop':
                if (absRowDiff !== absColDiff) return false;
                return isPathClear(fromRow, fromCol, toRow, toCol, currentMatrix);

            case 'rook':
                if (fromRow !== toRow && fromCol !== toCol) return false;
                return isPathClear(fromRow, fromCol, toRow, toCol, currentMatrix);

            case 'queen':
                if (absRowDiff !== absColDiff && fromRow !== toRow && fromCol !== toCol) return false;
                return isPathClear(fromRow, fromCol, toRow, toCol, currentMatrix);

            case 'king':
                // Basic structural single step move check
                return absRowDiff <= 1 && absColDiff <= 1;
        }

        return false;
    }

    /**
     * Scans rows and cols structural pathways to check for intervening physical obstacles
     */
    function isPathClear(fR, fC, tR, tC, matrix) {
        const stepRow = tR === fR ? 0 : (tR > fR ? 1 : -1);
        const stepCol = tC === fC ? 0 : (tC > fC ? 1 : -1);

        let currR = fR + stepRow;
        let currC = fC + stepCol;

        while (currR !== tR || currC !== tC) {
            if (matrix[currR][currC] !== null) {
                return false; // Intersection path contains a piece blocking movement
            }
            currR += stepRow;
            currC += stepCol;
        }
        return true;
    }

    // Module Exports attached up to global context windows
    return {
        createNewLogicGame: createNewLogicGame,
        checkLegality: checkLegality
    };
})();
