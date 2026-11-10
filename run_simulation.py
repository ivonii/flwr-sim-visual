"""Skrip untuk menjalankan simulasi Flower dengan 1 server dan 3 klien."""

import os
from flwr.simulation import run_simulation
from quickstart_numpy.server_app import app as server_app
from quickstart_numpy.client_app import app as client_app


def main() -> None:
    os.makedirs("results", exist_ok=True)

    run_simulation(
        server_app=server_app,
        client_app=client_app,
        num_supernodes=3,
        backend_name="ray",
        backend_config={
            "init_args": {
                "object_store_memory": 256 * 1024 * 1024,
                "include_dashboard": False,
            }
        },
    )


if __name__ == "__main__":
    main()