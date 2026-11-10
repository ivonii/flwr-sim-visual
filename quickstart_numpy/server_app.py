"""ServerApp: menentukan strategi FedAvg dan jumlah ronde federasi."""

import json
import os
from flwr.common import Context
from flwr.server import ServerApp, ServerAppComponents, ServerConfig
from flwr.server.strategy import FedAvg


class SaveMetricsFedAvg(FedAvg):
    """FedAvg yang menyimpan loss dan akurasi per ronde ke results/history.json."""

    def aggregate_evaluate(self, server_round, results, failures):
        loss, metrics = super().aggregate_evaluate(server_round, results, failures)
        if loss is not None:
            os.makedirs("results", exist_ok=True)
            path = "results/history.json"
            history = []
            if os.path.exists(path):
                with open(path, "r") as f:
                    history = json.load(f)
            history.append(
                {
                    "round": int(server_round),
                    "loss": float(loss),
                    "accuracy": float(metrics.get("accuracy", 0.0)),
                }
            )
            with open(path, "w") as f:
                json.dump(history, f, indent=2)
        return loss, metrics


def server_fn(context: Context) -> ServerAppComponents:
    """Bangun komponen server (strategi + konfigurasi)."""
    strategy = SaveMetricsFedAvg(
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=3,
        min_evaluate_clients=3,
        min_available_clients=3,
    )

    server_config = ServerConfig(num_rounds=5)

    return ServerAppComponents(
        strategy=strategy,
        config=server_config,
    )


app = ServerApp(server_fn=server_fn)