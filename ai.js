/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - AI MODULE
 * ==========================================================================
 * Standard Decision Engine utilizing Minimax search with Alpha-Beta pruning
 * and positional evaluation weights for basic chess automation.
 */

window.ChessAI = (function () {

    // Simple Relative Piece Weights
    const PIECE_VALUES = {
        pawn: 10,
        knight: 30,
        bishop: 30,
        rook: 50,
        queen: 90,
        king: 9000
    };

    /**
     * Entry-point interface fetching tactical vector targets for the machine turn
     * @param {Array} boardMatrix - The current 8x8 virtual board data matrix
     * @param {string} aiTeam - 'black' | 'white'
     * @param {Function} callback - Execution returns handling response payload
     */
    function requestBestMove(boardMatrix, aiTeam, callback) {
        // Gather all legal paths open to the current AI array state
        const legalMoves = gatherAllLegalMoves(boardMatrix, aiTeam);

        if (legalMoves.length === 0) {
            callback(null);
            return;
        }

        // Fallback fallback: Default baseline to immediate first move index
        let bestMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        let bestScore = aiTeam === 'black' ? Infinity : -Infinity;

        // Perform a shallow Minimax evaluation depth loop 
        // Higher depth structures will freeze UI threads without Web Workers optimization
        const evaluationDepth = 2; 

        for (let i = 0; i < legalMoves.length; i++) {
            const currentMove = legalMoves[i];
            
            // Generate simulated sandbox state matrices
            const sandboxBoard = cloneMatrixState(boardMatrix);
            simulateMatrixMove(sandboxBoard, currentMove);

            // Compute structural weight
            const score = minimax(sandboxBoard, evaluationDepth - 1, -Infinity, Infinity, aiTeam === 'white');

            if (aiTeam === 'black' && score < bestScore) {
                bestScore = score;
                bestMove = currentMove;
            } else if (aiTeam === 'white' && score > bestScore) {
                bestScore = score;
                bestMove = currentMove;
            }
        }

        callback(bestMove);
    }

    /**
     * Alpha-Beta Minimax recursive evaluation lookahead tree loop
     */
    function minimax(board, depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return evaluateBoardScore(board);
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            const moves = gatherAllLegalMoves(board, 'white');
            for (let i = 0; i < moves.length; i++) {
                simulateMatrixMove(board, moves[i]);
                maxScore = Math.max(maxScore, minimax(board, depth - 1, alpha, beta, false));
                alpha = Math.max(alpha, maxScore);
                if (beta <= alpha) break; // Prune pathway branches
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            const moves = gatherAllLegalMoves(board, 'black');
            for (let i = 0; i < moves.length; i++) {
                simulateMatrixMove(board, moves[i]);
                minScore = Math.min(minScore, minimax(board, depth - 1, alpha, beta, true));
                beta = Math.min(beta, minScore);
                if (beta <= alpha) break; // Prune pathway branches
            }
            return minScore;
        }
    }

    /**
     * Evaluates tactical weight tallies across live board elements
     * Positive = White Favor, Negative = Black Favor
     */
    function evaluateBoardScore(board) {
        let tally = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = board[r][c];
                if (cell) {
                    const weight = PIECE_VALUES[cell.type] || 0;
                    tally += (cell.team === 'white') ? weight : -weight;
                }
            }
        }
        return tally;
    }

    /**
     * Generates a basic listing of available moves for evaluation passing
     */
    function gatherAllLegalMoves(board, team) {
        const movesList = [];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = board[r][c];
                if (cell && cell.team === team) {
                    // Primitive raycast calculation passing everywhere on board bounds
                    // Maps valid targets depending on generic empty/capture parameters
                    for (let targetR = 0; targetR < 8; targetR++) {
                        for (let targetC = 0; targetC < 8; targetC++) {
                            if (targetR === r && targetC === c) continue;
                            
                            const targetCell = board[targetR][targetC];
                            if (!targetCell || targetCell.team !== team) {
                                movesList.push({
                                    fromRow: r, fromCol: c,
                                    toRow: targetR, toCol: targetC,
                                    capturedPiece: targetCell ? targetCell.type : null
                                });
                            }
                        }
                    }
                }
            }
        }
        return movesList;
    }

    /**
     * Deep clones internal state data objects safely without reference links
     */
    function cloneMatrixState(matrix) {
        return matrix.map(row => row.map(cell => cell ? { ...cell } : null));
    }

    function simulateMatrixMove(matrix, move) {
        matrix[move.toRow][move.toCol] = matrix[move.fromRow][move.fromCol];
        matrix[move.fromRow][move.fromCol] = null;
    }

    // Module Exports
    return {
        requestBestMove: requestBestMove
    };
})();
          
