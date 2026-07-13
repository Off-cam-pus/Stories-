/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - UI MODULE
 * ==========================================================================
 * Manages HUD readouts, updating match countdown timers, move logs,
 * captured counters, and system overlay modals.
 */

window.UIManager = (function () {
    // Clock tracking data registers
    let whiteTimeRemaining = 600;
    let blackTimeRemaining = 600;
    let countdownInterval = null;
    let activeClockTeam = null;

    // Cache structural elements internally
    let clockWhiteEl, clockBlackEl, turnIndicatorEl, moveHistoryEl;
    let capturedWhiteEl, capturedBlackEl, gameOverModalEl;

    /**
     * Maps static reference access paths across active elements
     */
    function init() {
        clockWhiteEl = document.getElementById('clock-white');
        clockBlackEl = document.getElementById('clock-black');
        turnIndicatorEl = document.getElementById('turn-indicator');
        moveHistoryEl = document.getElementById('move-history');
        capturedWhiteEl = document.getElementById('captured-by-white');
        capturedBlackEl = document.getElementById('captured-by-black');
        gameOverModalEl = document.getElementById('game-over-modal');

        // Setup individual sub-module bindings if needed
        window.ControlsManager.init('canvas-container');
        window.Board3D.init('canvas-container');
    }

    /**
     * Wipes historical logs down cleanly and configures default timers
     */
    function resetMatchUI(initialTimeSeconds) {
        whiteTimeRemaining = initialTimeSeconds;
        blackTimeRemaining = initialTimeSeconds;
        activeClockTeam = null;
        
        clearInterval(countdownInterval);

        // Format and render string variables
        clockWhiteEl.textContent = formatTimeDisplay(whiteTimeRemaining);
        clockBlackEl.textContent = formatTimeDisplay(blackTimeRemaining);
        clockWhiteEl.classList.remove('active');
        clockBlackEl.classList.remove('active');

        // Scrub layout tables cleanly down to structural header row
        moveHistoryEl.innerHTML = `
            <div class="history-row header">
                <span>#</span><span>White</span><span>Black</span>
            </div>
        `;

        capturedWhiteEl.innerHTML = '';
        capturedBlackEl.innerHTML = '';
    }

    /**
     * Swaps structural active highlights across timer cards and ticks down seconds
     */
    function setActiveClock(team) {
        activeClockTeam = team;
        clearInterval(countdownInterval);

        if (team === 'white') {
            clockWhiteEl.classList.add('active');
            clockBlackEl.classList.remove('active');
        } else {
            clockBlackEl.classList.add('active');
            clockWhiteEl.classList.remove('active');
        }

        countdownInterval = setInterval(() => {
            if (!window.GameEngine.isGameActive()) {
                clearInterval(countdownInterval);
                return;
            }

            if (activeClockTeam === 'white') {
                whiteTimeRemaining--;
                clockWhiteEl.textContent = formatTimeDisplay(whiteTimeRemaining);
                if (whiteTimeRemaining <= 0) handleTimeout('black');
            } else {
                blackTimeRemaining--;
                clockBlackEl.textContent = formatTimeDisplay(blackTimeRemaining);
                if (blackTimeRemaining <= 0) handleTimeout('white');
            }
        }, 1000);
    }

    /**
     * Updates top hud ribbon element texts
     */
    function updateTurnIndicator(team) {
        turnIndicatorEl.textContent = `${team.charAt(0).toUpperCase() + team.slice(1)}'s Turn`;
        turnIndicatorEl.className = team === 'white' ? 'turn-white' : 'turn-black';
    }

    /**
     * Appends algebraic-style rows directly onto panel configurations
     */
    function appendMoveToLog(type, fR, fC, tR, tC, team) {
        // Translate spatial matrix columns back to classic text labels
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']; // Visual board coordinates invert arrays

        const moveString = `${type.charAt(0).toUpperCase()}${files[fC]}${ranks[fR]}→${files[tC]}${ranks[tR]}`;

        if (team === 'white') {
            // Append an entirely fresh match grid line item
            const currentRows = moveHistoryEl.querySelectorAll('.history-row:not(.header)');
            const indexNumber = currentRows.length + 1;

            const rowTemplate = document.createElement('div');
            rowTemplate.className = 'history-row';
            rowTemplate.id = `move-row-${indexNumber}`;
            rowTemplate.innerHTML = `<span>${indexNumber}.</span><span>${moveString}</span><span>...</span>`;
            
            moveHistoryEl.appendChild(rowTemplate);
        } else {
            // Target the last incomplete log segment and patch black column placement
            const currentRows = moveHistoryEl.querySelectorAll('.history-row:not(.header)');
            if (currentRows.length > 0) {
                const targetRow = currentRows[currentRows.length - 1];
                targetRow.children[2].textContent = moveString;
            }
        }

        // Keep viewport auto scrolled downward
        moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
    }

    /**
     * Spawns miniature icon fonts inside the captured sidebar storage racks
     */
    function logCapture(losingTeam, type) {
        const iconElement = document.createElement('i');
        iconElement.className = `fas fa-chess-${type}`;
        
        // Items captured by white go to white's scoring rack (and vice versa)
        if (losingTeam === 'black') {
            capturedWhiteEl.appendChild(iconElement);
        } else {
            capturedBlackEl.appendChild(iconElement);
        }
    }

    function showGameOverModal(winner, reason) {
        clearInterval(countdownInterval);
        document.getElementById('game-over-title').textContent = `${winner.toUpperCase()} VICI!`;
        document.getElementById('game-over-reason').textContent = reason;
        gameOverModalEl.classList.remove('hidden');
    }

    /**
     * Internal trigger dealing with flag fall conditions
     */
    function handleTimeout(winner) {
        window.GameEngine.executeMove = () => false; // Lock interactions down
        showGameOverModal(winner, "Match concluded via time control exhaustion.");
    }

    /**
     * Math mapping tool packing timestamps cleanly into MM:SS notations
     */
    function formatTimeDisplay(totalSeconds) {
        if (totalSeconds < 0) return "00:00";
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Module Exports
    return {
        init: init,
        resetMatchUI: resetMatchUI,
        setActiveClock: setActiveClock,
        updateTurnIndicator: updateTurnIndicator,
        appendMoveToLog: appendMoveToLog,
        logCapture: logCapture,
        showGameOverModal: showGameOverModal
    };
})();
          
