from flask import Flask, jsonify, render_template
import random

app = Flask(__name__)

MOVES = ["stone", "paper", "scissors"]


def decide_winner(user_move: str, computer_move: str) -> str:
    """Return 'user', 'computer', or 'draw'."""
    if user_move == computer_move:
        return "draw"

    winning_pairs = {
        ("stone", "scissors"),
        ("paper", "stone"),
        ("scissors", "paper"),
    }

    return "user" if (user_move, computer_move) in winning_pairs else "computer"


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/computer-move")
def computer_move():
    return jsonify({"move": random.choice(MOVES)})


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
