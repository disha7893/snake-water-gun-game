# Snake Water Gun (Hand Gesture Edition)

This project is a browser-based **Stone/Paper/Scissors** game where:

- The **human player** uses real-time hand gestures in front of a webcam.
- The **computer player** picks moves automatically.
- The app detects gestures using **MediaPipe Hands** in the frontend.
- A lightweight **Flask backend** serves the app.

## Files you should see in the repo

At the repository root (`snake-water-gun-game/`), you should see:

- `app.py`
- `requirements.txt`
- `README.md`
- `templates/index.html`
- `static/js/game.js`
- `static/css/style.css`

If you cannot see these files on GitHub, check the troubleshooting section below.

## Features

- Live webcam feed + hand landmarks
- Gesture recognition for:
  - **Stone** (rock)
  - **Paper**
  - **Scissors**
- Stability buffer to avoid noisy predictions
- Round-by-round scoring
- First to 5 wins

## Project structure

- `app.py` — Flask server
- `templates/index.html` — UI
- `static/css/style.css` — styling
- `static/js/game.js` — hand tracking + game logic

## Run locally

1. Create and activate a virtual environment (recommended):

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Start the server:

   ```bash
   python app.py
   ```

4. Open in browser:

   ```
   http://127.0.0.1:5000
   ```

## Troubleshooting: "I can't find files in the repo"

1. Make sure you are on the correct branch:

   ```bash
   git branch
   ```

2. Pull latest changes from remote:

   ```bash
   git pull origin <your-branch-name>
   ```

3. Confirm files exist locally:

   ```bash
   find . -maxdepth 3 -type f
   ```

4. If GitHub still doesn't show files, ensure you pushed commits:

   ```bash
   git push origin <your-branch-name>
   ```

## Notes for gesture accuracy

- Use good lighting.
- Keep one hand clearly visible.
- Keep your hand centered in frame.
- For scissors, spread index and middle fingers clearly.

## Future improvements

- Replace heuristic gesture classification with a trained model.
- Add multiplayer mode.
- Add per-round animation and sound effects.
- Persist match history in a database.
