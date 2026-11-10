"""Task: model NumPy sederhana, pelatihan, evaluasi, dan pembuatan data dummy."""

from __future__ import annotations

from typing import Dict, List, Tuple

import numpy as np

NDArrays = List[np.ndarray]


def sigmoid(z: np.ndarray) -> np.ndarray:
    """Fungsi aktivasi sigmoid yang stabil secara numerik."""
    return 1.0 / (1.0 + np.exp(-np.clip(z, -500.0, 500.0)))


def initialize_model(input_dim: int) -> Dict[str, np.ndarray]:
    """Inisialisasi bobot kecil acak dan bias nol."""
    rng = np.random.default_rng(42)
    W = rng.normal(0.0, 0.01, size=(input_dim,))
    b = np.zeros(())
    return {"W": W, "b": b}


def get_model_params(model: Dict[str, np.ndarray]) -> NDArrays:
    """Kembalikan parameter model sebagai daftar array NumPy."""
    return [model["W"], model["b"]]


def set_model_params(model: Dict[str, np.ndarray], params: NDArrays) -> None:
    """Set parameter model dari daftar array NumPy."""
    model["W"], model["b"] = params


def train(
    model: Dict[str, np.ndarray],
    X: np.ndarray,
    y: np.ndarray,
    *,
    epochs: int = 1,
    lr: float = 0.1,
) -> None:
    """Latih model dengan turunan gradien pada mean-squared error."""
    W = model["W"]
    b = model["b"]
    n = X.shape[0]

    for _ in range(epochs):
        z = X @ W + b
        y_pred = sigmoid(z)
        error = y_pred - y

        dW = (X.T @ error) / n
        db = np.mean(error)

        W = W - lr * dW
        b = b - lr * db

    model["W"] = W
    model["b"] = b


def test(
    model: Dict[str, np.ndarray], X: np.ndarray, y: np.ndarray
) -> Tuple[float, float]:
    """Evaluasi model dan kembalikan (loss, akurasi)."""
    W = model["W"]
    b = model["b"]

    z = X @ W + b
    y_pred = sigmoid(z)

    loss = float(np.mean((y_pred - y) ** 2))
    predictions = (y_pred >= 0.5).astype(float)
    accuracy = float(np.mean(predictions == y))
    return loss, accuracy


def load_data(
    num_samples: int = 200,
    input_dim: int = 10,
    *,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Buat data dummy klasifikasi biner (split 80/20 latih/uji)."""
    rng = np.random.RandomState(seed)
    X = rng.randn(num_samples, input_dim)

    true_W = rng.randn(input_dim)
    true_b = 0.5
    z = X @ true_W + true_b
    prob = sigmoid(z)
    y = (prob >= 0.5).astype(float)

    split = int(0.8 * num_samples)
    return X[:split], y[:split], X[split:], y[split:]
