/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - MAIN APPLICATION CONTROLLER
 * ==========================================================================
 * Core Orchestrator managing lifecycle, state transitions, and event binding.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State Engine
    const AppState = {
        isLoading: true,
        currentScreen: 'loading', // 'loading' | 'menu' | 'game'
        gameMode: null,           // 'pvp' | 'ai'
        settings: {
            soundEnabled: true,
            theme: 'classic',
            difficulty: 'medium',
            timeControl: 10
        }
    };

    // Cache DOM Elements for Performance
    const UI = {
        loadingScreen: document.getElementById('loading-screen'),
        progressBar: document.getElementById('progress-bar'),
        loadingStatus: document.getElementById('loading-status'),
        mainMenu: document.getElementById('main-menu'),
        gameContainer: document.getElementById('game-container'),
        
        // Buttons
        btnPvp: document.getElementById('btn-pvp'),
        btnAi: document.getElementById('btn-ai'),
        btnOpenSettings: document.getElementById('btn-open-settings'),
        btnMenuSettings: document.getElementById('btn-menu-settings'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        btnHome: document.getElementById('btn-home'),
        btnRematch: document.getElementById('btn-rematch'),
        btnQuit: document.getElementById('btn-quit'),
        
        // Modals
        settingsModal: document.getElementById('settings-modal'),
        gameOverModal: document.getElementById('game-over-modal'),
        
        // Settings Inputs
        settingSound: document.getElementById('setting-sound'),
        settingTheme: document.getElementById('setting-theme'),
        settingDifficulty: document.getElementById('setting-difficulty'),
        settingTime: document.getElementById('setting-time')
    };

    /**
     * 1. INITIALIZATION & LOADING SIMULATION
     * Coordinates Asset Loader module to handle Three.js/Texture loads
     */
    function init() {
        simulateAssetLoading((progress) => {
            UI.progressBar.style.width = `${progress}%`;
            
            if (progress < 40) {
                UI.loadingStatus.textContent = "Compiling WebGL shaders...";
            } else if (progress < 80) {
                UI.loadingStatus.textContent = "Parsing high-poly 3D chess pieces...";
            } else {
                UI.loadingStatus.textContent = "Baking environmental lighting maps...";
            }
        }, () => {
            // Loading Complete callback
            AppState.isLoading = false;
            transitionScreen('menu');
            // Initialize global UI, Sound system and Controls hooks if available
            if (window.SoundManager) window.SoundManager.init(AppState.settings.soundEnabled);
            if (window.UIManager) window.UIManager.init();
        });

        bindEvents();
    }

    /**
     * 2. EVENT BINDINGS
     * Maps user actions across the app to internal system commands
     */
    function bindEvents() {
        // Main Menu Action Handlers
        UI.btnPvp.addEventListener('click', () => startMatch('pvp'));
        UI.btnAi.addEventListener('click', () => startMatch('ai'));

        // Settings Dialog Core Toggles
        UI.btnOpenSettings.addEventListener('click', toggleSettings);
        UI.btnMenuSettings.addEventListener('click', toggleSettings);
        UI.btnCloseSettings.addEventListener('click', toggleSettings);

        // Update settings dynamically as user interacts with modal options
        UI.settingSound.addEventListener('change', (e) => {
            AppState.settings.soundEnabled = e.target.checked;
            if (window.SoundManager) window.SoundManager.setMute(!e.target.checked);
        });

        UI.settingTheme.addEventListener('change', (e) => {
            AppState.settings.theme = e.target.value;
            if (window.Board3D) window.Board3D.updateTheme(e.target.value);
        });

        UI.settingDifficulty.addEventListener('change', (e) => {
            AppState.settings.difficulty = e.target.value;
        });

        UI.settingTime.addEventListener('change', (e) => {
            AppState.settings.timeControl = parseInt(e.target.value, 10);
        });

        // Navigation & End Game Lifecycle triggers
        UI.btnHome.addEventListener('click', () => {
            if (confirm("Are you sure you want to end this game and return to the main menu?")) {
                exitToMenu();
            }
        });
        
        UI.btnQuit.addEventListener('click', exitToMenu);
        UI.btnRematch.addEventListener('click', () => {
            UI.gameOverModal.classList.add('hidden');
            startMatch(AppState.gameMode);
        });
    }

    /**
     * 3. MATCH LIFECYCLE MANAGEMENT
     */
    function startMatch(mode) {
        AppState.gameMode = mode;
        transitionScreen('game');

        // Pass config payload down to the global subsystems executing the execution context
        if (window.GameEngine) {
            window.GameEngine.setupNewMatch({
                mode: AppState.gameMode,
                timeLimit: AppState.settings.timeControl * 60, // translate to seconds
                difficulty: AppState.settings.difficulty,
                theme: AppState.settings.theme
            });
        }
    }

    function exitToMenu() {
        UI.gameOverModal.classList.add('hidden');
        if (window.GameEngine) window.GameEngine.terminateActiveMatch();
        transitionScreen('menu');
    }

    /**
     * 4. APP VIEW STATE ROUTER
     */
    function transitionScreen(target) {
        // Clear screen visibility states 
        UI.loadingScreen.classList.add('hidden');
        UI.mainMenu.classList.add('hidden');
        UI.gameContainer.classList.add('hidden');

        // Target state assignment routing
        if (target === 'menu') {
            UI.mainMenu.classList.remove('hidden');
            AppState.currentScreen = 'menu';
        } else if (target === 'game') {
            UI.gameContainer.classList.remove('hidden');
            AppState.currentScreen = 'game';
            // Explicit resize request to kick Three.js sizing systems into sync 
            window.dispatchEvent(new Event('resize'));
        }
    }

    function toggleSettings() {
        UI.settingsModal.classList.toggle('hidden');
    }

    /**
     * 5. HELPER: ASSET LOADER PIPELINE SIMULATOR
     * Hooks structural dependencies up to asset load frames smoothly
     */
    function simulateAssetLoading(onProgress, onComplete) {
        let currentProgress = 0;
        const interval = setInterval(() => {
            // Generate non-linear progress curves for organic realistic loader speed 
            const increment = Math.floor(Math.random() * 12) + 3;
            currentProgress = Math.min(currentProgress + increment, 100);
            
            onProgress(currentProgress);

            if (currentProgress >= 100) {
                clearInterval(interval);
                setTimeout(onComplete, 400); // Small aesthetic hold
            }
        }, 120);
    }

    // Initialize application execution pipeline
    init();
});
  
